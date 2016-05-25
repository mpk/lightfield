/**
 *	Depth map
 */
package main

import (
	"image/color"
	"image/png"
	"strings"
	"runtime"
	"image"
	"bufio"
	"math"
	"flag"
	"time"
	"log"
	"fmt"
	"os"
)

const FocusBias = 4.0
const FocusStep = 0.2
const PixelBias = 16

/*
 *	struct ImageData
 */
type ImageData struct {
	Width, Height, Size int
	Pixels []uint8
}

func (i *ImageData) Allocate() {
	i.Pixels = make([]uint8, i.Width * i.Height * i.Size)
}

func (i *ImageData) GetPixel(x int, y int, index int) uint8 {
	return i.Pixels[(y * i.Width + x) * i.Size + index]
}

func (i *ImageData) GetPixelBilinear(x float64, y float64, index int) uint8 {
	x1 := math.Floor(x)
	x2 := math.Ceil(x)
	y1 := math.Floor(y)
	y2 := math.Ceil(y)

	f11 := float64(i.GetPixel(int(x1), int(y1), index))
	f12 := float64(i.GetPixel(int(x1), int(y2), index))
	f21 := float64(i.GetPixel(int(x2), int(y1), index))
	f22 := float64(i.GetPixel(int(x2), int(y2), index))

	m1 := f11 * (x2 - x) + f21 * (1 - (x2 - x))
	m2 := f12 * (x2 - x) + f22 * (1 - (x2 - x))

	return uint8(m1 * (y2 - y) + m2 * (1 - (y2 - y)))
}

func (i *ImageData) SetPixel(x int, y int, index int, value uint8) {
	i.Pixels[(y * i.Width + x) * i.Size + index] = value
}

/*
 *	struct ImageFocusData
 */
type ImageFocusData struct {
	Width, Height int
	Focus float64
	Pixels []float64
}

func (i *ImageFocusData) Allocate() {
	i.Pixels = make([]float64, i.Width * i.Height)
}

/*
 *	struct DepthData
 */
type DepthData struct {
	Value float64
	Focus float64
}

/*
 *	misc math functions
 */
func Min(a int, b int) int {
	if (a > b) {
		return b
	}

	return a
}

func Max(a int, b int) int {
	if (a > b) {
		return a
	}

	return b
}

func LoadImage(filename string) *ImageData {
	file, err := os.Open(filename)

	if err != nil {
		log.Fatalf("[error] Cannot open %s\n", filename)
	}

	reader := bufio.NewReader(file)
	image, err := png.Decode(reader)

	if err != nil {
		log.Fatalf("[error] Cannot decode %s as PNG file\n", filename)
	}

	outputImage := ImageData{ Width: image.Bounds().Max.X, Height: image.Bounds().Max.Y, Size: 3 }
	outputImage.Allocate()

	for x := 0; x < outputImage.Width; x++ {
		for y := 0; y < outputImage.Height; y++ {
			iR, iG, iB, _ := image.At(x, y).RGBA()
			outputImage.SetPixel(x, y, 0, uint8(iR))
			outputImage.SetPixel(x, y, 1, uint8(iG))
			outputImage.SetPixel(x, y, 2, uint8(iB))
		}
	}

	return &outputImage
}

func CreateFocusData(imageData *[]*ImageData, matrixWidth int, matrixHeight int, focus float64, finish chan *ImageFocusData) {
	imageWidth := (*imageData)[0].Width
	imageHeight := (*imageData)[0].Height

	matrixSize := matrixWidth * matrixHeight
	matrixOffsetX := matrixWidth / 2
	matrixOffsetY := matrixHeight / 2

	pixelSize := (PixelBias * 2 + 1) * (PixelBias * 2 + 1)

	pixelValues := make([]float64, imageWidth * imageHeight)
	outputData := ImageFocusData{ Width: imageWidth, Height: imageHeight, Focus: focus }
	outputData.Allocate()

	vR := make([]float64, matrixSize)
	vG := make([]float64, matrixSize)
	vB := make([]float64, matrixSize)

	// Compute std dev for every pixel in image for current focus value
	for imageX := 0; imageX < imageWidth; imageX++ {
		for imageY := 0; imageY < imageHeight; imageY++ {
			index := imageY * imageWidth + imageX

			sR, sG, sB := 0.0, 0.0, 0.0

			for dtX := -matrixOffsetX; dtX <= matrixOffsetX; dtX++ {
				for dtY := -matrixOffsetY; dtY <= matrixOffsetY; dtY++ {
					imageIndex := (dtY + matrixOffsetY) * matrixWidth + dtX + matrixOffsetX

					x := math.Min(math.Max(float64(imageX) + focus * float64(dtX), 0), float64(imageWidth - 1))
					y := math.Min(math.Max(float64(imageY) + focus * float64(dtY), 0), float64(imageHeight - 1))

					vR[imageIndex] = float64((*imageData)[imageIndex].GetPixelBilinear(x, y, 0))
					vG[imageIndex] = float64((*imageData)[imageIndex].GetPixelBilinear(x, y, 1))
					vB[imageIndex] = float64((*imageData)[imageIndex].GetPixelBilinear(x, y, 2))
					sR += vR[imageIndex]
					sG += vG[imageIndex]
					sB += vB[imageIndex]
				}
			}

			avR := sR / float64(matrixSize)
			avG := sG / float64(matrixSize)
			avB := sB / float64(matrixSize)

			sPwR, sPwG, sPwB := 0.0, 0.0, 0.0

			for i := 0; i < matrixSize; i++ {
				sPwR += math.Pow(vR[i] - avR, 2)
				sPwG += math.Pow(vG[i] - avG, 2)
				sPwB += math.Pow(vB[i] - avB, 2)
			}

			valueR := math.Sqrt(sPwR / float64(matrixSize))
			valueG := math.Sqrt(sPwG / float64(matrixSize))
			valueB := math.Sqrt(sPwB / float64(matrixSize))
			pixelValues[index] = (valueR + valueG + valueB) / 3
		}
	}

	// Average std dev in pixel neighbourhood (PixelBias)
	for imageX := 0; imageX < imageWidth; imageX++ {
		for imageY := 0; imageY < imageHeight; imageY++ {
			index := imageY * imageWidth + imageX
			sum := 0.0

			for nX := -PixelBias; nX <= PixelBias; nX++ {
				for nY := -PixelBias; nY <= PixelBias; nY++ {
					x := Min(Max(imageX + nX, 0), imageWidth - 1)
					y := Min(Max(imageY + nY, 0), imageHeight - 1)

					sum += pixelValues[(y * imageWidth + x)]
				}
			}

			outputData.Pixels[index] = sum / float64(pixelSize)
		}
	}

	finish <- &outputData
}

func SaveDepthImage(outputDepth []*DepthData, imageWidth int, imageHeight int, filename string) {
	outputImage := image.NewRGBA(image.Rect(0, 0, imageWidth, imageHeight))

	for x := 0; x < imageWidth; x++ {
		for y := 0; y < imageHeight; y++ {
			index := y * imageWidth + x
			depth := uint8(128 + outputDepth[index].Focus / FocusStep)
			outputImage.Set(x, y, color.RGBA{depth, depth, depth, 255})
		}
	}

	file, err := os.Create(filename)

	if err != nil {
		log.Fatalf("[error] Cannot create output image")
	}

	png.Encode(file, outputImage)
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	// Command line input
	optImageSources := flag.String("i", "none", "Source PNG images filenames")
	optImageOutput := flag.String("o", "none", "Output PNG image filename")
	optMatrixHeight := flag.Int("h", 0, "Matrix height")
	optMatrixWidth := flag.Int("w", 0, "Matrix width")

	flag.Parse()

	// Load ordered source images (format: "filename|filename| ...")
	sources := strings.Split(*optImageSources, "|")
	sourceImages := make([]*ImageData, (*optMatrixWidth) * (*optMatrixHeight))
	for x := 0; x < (*optMatrixWidth); x++ {
		for y := 0; y < (*optMatrixHeight); y++ {
			index := y * (*optMatrixWidth) + x
			sourceImages[index] = LoadImage(sources[index])
		}
	}

	imageWidth := sourceImages[0].Width
	imageHeight := sourceImages[0].Height

	timeStart := time.Now().UnixNano() / 1e6

	// Create input/output for threads
	focusSteps := int((FocusBias * 2) / FocusStep + 1)
	outputChannel := make(chan *ImageFocusData, focusSteps)
	imageFocusData := make([]*ImageFocusData, focusSteps)

	// Calculate "value" for each pixel, focus
	focus := -FocusBias
	for i := 0; i < focusSteps; i++ {
		go CreateFocusData(&sourceImages, *optMatrixWidth, *optMatrixHeight, focus, outputChannel)
		focus += FocusStep
	}

	// Wait for results
	for i := 0; i < focusSteps; i++ {
		imageFocusData[i] = <- outputChannel
	}

	// Calculate best focus for every pixel from results
	outputDepth := make([]*DepthData, imageWidth * imageHeight);
	for i := 0; i < len(outputDepth); i++ {
		outputDepth[i] = new(DepthData)
		outputDepth[i].Value = math.MaxFloat64
	}

	for i := 0; i < focusSteps; i++ {
		for imageX := 0; imageX < imageWidth; imageX++ {
			for imageY := 0; imageY < imageHeight; imageY++ {
				index := imageY * imageWidth + imageX
				if (imageFocusData[i].Pixels[index] < outputDepth[index].Value) {
					outputDepth[index].Value = imageFocusData[i].Pixels[index]
					outputDepth[index].Focus = imageFocusData[i].Focus
				}
			}
		}
	}

	timeEnd := time.Now().UnixNano() / 1e6
	fmt.Printf("[info] Elapsed time: %d ms\n", timeEnd - timeStart)

	// Find useful focus bounds
	focusHistogram := make([]float64, focusSteps)
	coverThreshold := float64(imageWidth * imageHeight) * 0.001
	focusMin := math.MaxFloat64
	focusMax := math.MaxFloat64

	for imageX := 0; imageX < imageWidth; imageX++ {
		for imageY := 0; imageY < imageHeight; imageY++ {
			index := imageY * imageWidth + imageX
			focusHistogram[int((outputDepth[index].Focus + FocusBias) / FocusStep)]++
		}
	}

	for i := 0; i < focusSteps; i++ {
		if focusMin == math.MaxFloat64 && focusHistogram[i] > coverThreshold {
			focusMin = float64(i) * FocusStep - FocusBias
		}
	}

	for i := focusSteps - 1; i >= 0; i-- {
		if focusMax == math.MaxFloat64 && focusHistogram[i] > coverThreshold {
			focusMax = float64(i) * FocusStep - FocusBias
		}
	}

	fmt.Printf("[info] Focus-Min: %.1f\n", focusMin)
	fmt.Printf("[info] Focus-Max: %.1f\n", focusMax)

	// Save output data
	SaveDepthImage(outputDepth, imageWidth, imageHeight, *optImageOutput)
}