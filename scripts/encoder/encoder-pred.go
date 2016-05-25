/**
 *	Predicted frame encoder
 */
package main

import (
	"image/color"
	"image/jpeg"
	"image/png"
	"strings"
	"strconv"
	"image"
	"bufio"
	"math"
	"flag"
	"time"
	"log"
	"fmt"
	"os"
)

const BlockSize = 16
const BlockMaxOffset = 8
const BlockMaxFractOffset = 0.5
const BlockFractStep = 0.25

/*
 *	struct ImageData
 */
type ImageData struct {
	Width, Height, Size int
	Pixels []float64
}

func (i *ImageData) Allocate() {
	i.Pixels = make([]float64, i.Width * i.Height * i.Size)
}

func (i *ImageData) GetPixel(x int, y int, index int) float64 {
	return i.Pixels[(y * i.Width + x) * i.Size + index]
}

func (i *ImageData) GetPixelBilinear(x float64, y float64, index int) float64 {
	x1 := math.Floor(x)
	x2 := math.Ceil(x)
	y1 := math.Floor(y)
	y2 := math.Ceil(y)

	f11 := i.GetPixel(int(x1), int(y1), index)
	f12 := i.GetPixel(int(x1), int(y2), index)
	f21 := i.GetPixel(int(x2), int(y1), index)
	f22 := i.GetPixel(int(x2), int(y2), index)

	m1 := f11 * (x2 - x) + f21 * (1 - (x2 - x))
	m2 := f12 * (x2 - x) + f22 * (1 - (x2 - x))

	return m1 * (y2 - y) + m2 * (1 - (y2 - y))
}

func (i *ImageData) SetPixel(x int, y int, index int, value float64) {
	i.Pixels[(y * i.Width + x) * i.Size + index] = value
}

/*
 *	struct Block, BlockData
 */
type Block struct {
	DtX, DtY float64
	SourceIndex int
}

type BlockData struct {
	Width, Height int
	Blocks []*Block
}

func (b *BlockData) Allocate() {
	b.Blocks = make([]*Block, b.Width * b.Height)
	for i := 0; i < len(b.Blocks); i++ {
		b.Blocks[i] = new(Block)
	}
}

func (b *BlockData) GetBlock(x int, y int) *Block {
	return b.Blocks[y * b.Width + x]
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

func Abs(d float64) float64 {
	if (d < 0) {
		return -d
	}
	return d
}

func LoadImageJPEG(filename string) *ImageData {
	file, err := os.Open(filename)

	if err != nil {
		log.Fatalf("[error] Cannot open %s\n", filename)
	}

	reader := bufio.NewReader(file)
	image, err := jpeg.Decode(reader)

	if err != nil {
		log.Fatalf("[error] Cannot decode %s as JPEG file\n", filename)
	}

	outputImage := ImageData{ Width: image.Bounds().Max.X, Height: image.Bounds().Max.Y, Size: 3 }
	outputImage.Allocate()

	for x := 0; x < outputImage.Width; x++ {
		for y := 0; y < outputImage.Height; y++ {
			iR, iG, iB, _ := image.At(x, y).RGBA()
			outputImage.SetPixel(x, y, 0, float64(iR))
			outputImage.SetPixel(x, y, 1, float64(iG))
			outputImage.SetPixel(x, y, 2, float64(iB))
		}
	}

	return &outputImage
}

func LoadImagePNG(filename string) *ImageData {
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
			outputImage.SetPixel(x, y, 0, float64(iR))
			outputImage.SetPixel(x, y, 1, float64(iG))
			outputImage.SetPixel(x, y, 2, float64(iB))
		}
	}

	return &outputImage
}

func GetBlockDiff(sourceImage *ImageData, sourceX int, sourceY int, targetImage *ImageData, targetX int, targetY int, minBlockDiff int) int {
	minDiff := float64(minBlockDiff)
	blockDiff := 0.0

	imageWidth := targetImage.Width
	imageSize := targetImage.Size

	sourcePixels := sourceImage.Pixels
	targetPixels := targetImage.Pixels

	for blockX := 0; blockX < BlockSize; blockX++ {
		for blockY := 0; blockY < BlockSize; blockY++ {
			sourceIndex := ((sourceY + blockY) * imageWidth + sourceX + blockX) * imageSize
			targetIndex := ((targetY + blockY) * imageWidth + targetX + blockX) * imageSize

			// Manually inlined for better performance
			sR := sourcePixels[sourceIndex]
			sG := sourcePixels[sourceIndex + 1]
			sB := sourcePixels[sourceIndex + 2]
			tR := targetPixels[targetIndex]
			tG := targetPixels[targetIndex + 1]
			tB := targetPixels[targetIndex + 2]

			blockDiff += Abs(tR - sR) + Abs(tG - sG) + Abs(tB - sB)

			if (blockDiff > minDiff) {
				return math.MaxInt32
			}
		}
	}

	return int(blockDiff)
}

func GetBlockDiffBilinear(sourceImage *ImageData, sourceX float64, sourceY float64, targetImage *ImageData, targetX int, targetY int, minBlockDiff int) int {
	minDiff := float64(minBlockDiff)
	blockDiff := 0.0

	imageWidth := targetImage.Width
	imageSize := targetImage.Size

	sourcePixels := sourceImage.Pixels
	targetPixels := targetImage.Pixels

	sourceX1 := int(math.Floor(sourceX))
	sourceX2 := int(math.Ceil(sourceX))
	sourceY1 := int(math.Floor(sourceY))
	sourceY2 := int(math.Ceil(sourceY))

	factorX := float64(sourceX2) - sourceX
	factorY := float64(sourceY2) - sourceY

	for blockX := 0; blockX < BlockSize; blockX++ {
		for blockY := 0; blockY < BlockSize; blockY++ {
			sourceIndex11 := ((sourceY1 + blockY) * imageWidth + sourceX1 + blockX) * imageSize
			sourceIndex12 := ((sourceY2 + blockY) * imageWidth + sourceX1 + blockX) * imageSize
			sourceIndex21 := ((sourceY1 + blockY) * imageWidth + sourceX2 + blockX) * imageSize
			sourceIndex22 := ((sourceY2 + blockY) * imageWidth + sourceX2 + blockX) * imageSize
			targetIndex := ((targetY + blockY) * imageWidth + targetX + blockX) * imageSize

			// Manually inlined for better performance
			sR11 := sourcePixels[sourceIndex11]
			sG11 := sourcePixels[sourceIndex11 + 1]
			sB11 := sourcePixels[sourceIndex11 + 2]
			sR12 := sourcePixels[sourceIndex12]
			sG12 := sourcePixels[sourceIndex12 + 1]
			sB12 := sourcePixels[sourceIndex12 + 2]
			sR21 := sourcePixels[sourceIndex21]
			sG21 := sourcePixels[sourceIndex21 + 1]
			sB21 := sourcePixels[sourceIndex21 + 2]
			sR22 := sourcePixels[sourceIndex22]
			sG22 := sourcePixels[sourceIndex22 + 1]
			sB22 := sourcePixels[sourceIndex22 + 2]

			sR1 := sR11 * factorX + sR21 * (1 - factorX)
			sG1 := sG11 * factorX + sG21 * (1 - factorX)
			sB1 := sB11 * factorX + sB21 * (1 - factorX)
			sR2 := sR12 * factorX + sR22 * (1 - factorX)
			sG2 := sG12 * factorX + sG22 * (1 - factorX)
			sB2 := sB12 * factorX + sB22 * (1 - factorX)

			sR := sR1 * factorY + sR2 * (1 - factorY)
			sG := sG1 * factorY + sG2 * (1 - factorY)
			sB := sB1 * factorY + sB2 * (1 - factorY)

			tR := targetPixels[targetIndex]
			tG := targetPixels[targetIndex + 1]
			tB := targetPixels[targetIndex + 2]

			blockDiff += Abs(tR - sR) + Abs(tG - sG) + Abs(tB - sB)

			if (blockDiff > minDiff) {
				return math.MaxInt32
			}
		}
	}

	return int(blockDiff)
}

func CreateDelta(sourceImages []*ImageData, targetImage *ImageData, verbose bool) *BlockData {
	outputBlocks := BlockData{ Width: targetImage.Width / BlockSize, Height: targetImage.Height / BlockSize }
	outputBlocks.Allocate()

	for x := 0; x < targetImage.Width; x += BlockSize {
		for y := 0; y < targetImage.Height; y += BlockSize {
			minBlockDiff := math.MaxInt32
			blockDtX := 0.0
			blockDtY := 0.0
			blockSourceIndex := 0

			// Iterate over source images to find best match for target image block
			minX := Max(x - BlockMaxOffset, 0)
			maxX := Min(x + BlockMaxOffset, targetImage.Width - BlockSize)
			minY := Max(y - BlockMaxOffset, 0)
			maxY := Min(y + BlockMaxOffset, targetImage.Height - BlockSize)

			for sourceIndex := 0; sourceIndex < len(sourceImages); sourceIndex++ {
				for sourceX := minX; sourceX <= maxX; sourceX++ {
					for sourceY := minY; sourceY <= maxY; sourceY++ {
						blockDiff := GetBlockDiff(sourceImages[sourceIndex], sourceX, sourceY, targetImage, x, y, minBlockDiff)
						if (blockDiff < minBlockDiff) {
							minBlockDiff = blockDiff
							blockDtX = float64(sourceX - x)
							blockDtY = float64(sourceY - y)
							blockSourceIndex = sourceIndex
						}
					}
				}
			}

			// Improve output with subpixel precision
			minXs := math.Max(float64(x) + blockDtX - BlockMaxFractOffset, float64(minX))
			maxXs := math.Min(float64(x) + blockDtX + BlockMaxFractOffset, float64(maxX))
			minYs := math.Max(float64(y) + blockDtY - BlockMaxFractOffset, float64(minY))
			maxYs := math.Min(float64(y) + blockDtY + BlockMaxFractOffset, float64(maxY))

			for sourceX := minXs; sourceX <= maxXs; sourceX += BlockFractStep {
				for sourceY := minYs; sourceY <= maxYs; sourceY += BlockFractStep {
					blockDiff := GetBlockDiffBilinear(sourceImages[blockSourceIndex], sourceX, sourceY, targetImage, x, y, minBlockDiff)
					if (blockDiff < minBlockDiff) {
						minBlockDiff = blockDiff
						blockDtX = sourceX - float64(x)
						blockDtY = sourceY - float64(y)
					}
				}
			}

			if verbose {
				fmt.Printf("[%d, %d] | %.2f %.2f (%d)\n", x, y, blockDtX, blockDtY, blockSourceIndex)
			}

			block := outputBlocks.GetBlock(x / BlockSize, y / BlockSize)
			block.DtX = blockDtX
			block.DtY = blockDtY
			block.SourceIndex = blockSourceIndex
		}
	}

	return &outputBlocks
}

func GetSSIMChannel(sourceImages []*ImageData, targetImage *ImageData, blocks *BlockData, index int) float64 {
	sSum := 0.0
	tSum := 0.0

	for x := 0; x < targetImage.Width; x += BlockSize {
		for y := 0; y < targetImage.Height; y += BlockSize {
			block := blocks.GetBlock(x / BlockSize, y / BlockSize)

			for blockX := 0; blockX < BlockSize; blockX++ {
				for blockY := 0; blockY < BlockSize; blockY++ {
					sSum += sourceImages[block.SourceIndex].GetPixelBilinear(float64(x + blockX) + block.DtX, float64(y + blockY) + block.DtY, index) / 256

					tSum += targetImage.GetPixel(x + blockX, y + blockY, index) / 256
				}
			}
		}
	}

	sMean := sSum / float64(targetImage.Width * targetImage.Height)
	tMean := tSum / float64(targetImage.Width * targetImage.Height)

	sStSum := 0.0
	tStSum := 0.0
	covSum := 0.0

	for x := 0; x < targetImage.Width; x += BlockSize {
		for y := 0; y < targetImage.Height; y += BlockSize {
			block := blocks.GetBlock(x / BlockSize, y / BlockSize)

			for blockX := 0; blockX < BlockSize; blockX++ {
				for blockY := 0; blockY < BlockSize; blockY++ {
					s := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x + blockX) + block.DtX, float64(y + blockY) + block.DtY, index) / 256

					t := targetImage.GetPixel(x + blockX, y + blockY, index) / 256

					sStSum += math.Pow(s - sMean, 2)
					tStSum += math.Pow(t - tMean, 2)
					covSum += (s - sMean) * (t - tMean)
				}
			}
		}
	}

	sStDev := math.Sqrt(sStSum / float64(targetImage.Width * targetImage.Height))
	tStDev := math.Sqrt(tStSum / float64(targetImage.Width * targetImage.Height))
	cov := covSum / float64(targetImage.Width * targetImage.Height)

	C1 := math.Pow(0.01 * 255.0, 2)
	C2 := math.Pow(0.03 * 255.0, 2)

	return ((2.0 * sMean * tMean + C1) * (2.0 * cov + C2)) / ((math.Pow(sMean, 2) + math.Pow(tMean, 2) + C1) * (math.Pow(sStDev, 2) + math.Pow(tStDev, 2) + C2))
}

func GetSSIM(sourceImages []*ImageData, targetImage *ImageData, blocks *BlockData) float64 {
	indexR := GetSSIMChannel(sourceImages, targetImage, blocks, 0)
	indexG := GetSSIMChannel(sourceImages, targetImage, blocks, 1)
	indexB := GetSSIMChannel(sourceImages, targetImage, blocks, 2)

	return (indexR + indexG + indexB) / 3.0;
}

func GetPSNR(sourceImages []*ImageData, targetImage *ImageData, blocks *BlockData) float64 {
	mseSum := 0.0

	for x := 0; x < targetImage.Width; x += BlockSize {
		for y := 0; y < targetImage.Height; y += BlockSize {
			block := blocks.GetBlock(x / BlockSize, y / BlockSize)

			for blockX := 0; blockX < BlockSize; blockX++ {
				for blockY := 0; blockY < BlockSize; blockY++ {
					sR := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x + blockX) + block.DtX, float64(y + blockY) + block.DtY, 0) / 256
					sG := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x + blockX) + block.DtX, float64(y + blockY) + block.DtY, 1) / 256
					sB := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x + blockX) + block.DtX, float64(y + blockY) + block.DtY, 2) / 256

					tR := targetImage.GetPixel(x + blockX, y + blockY, 0) / 256
					tG := targetImage.GetPixel(x + blockX, y + blockY, 1) / 256
					tB := targetImage.GetPixel(x + blockX, y + blockY, 2) / 256

					mseSum += math.Pow(tR - sR, 2) + math.Pow(tG - sG, 2) + math.Pow(tB - sB, 2)
				}
			}
		}
	}

	return 20 * math.Log10(255) - 10 * math.Log10(mseSum / float64(targetImage.Width * targetImage.Height * targetImage.Size));
}

func SaveReconstructedTarget(sourceImages []*ImageData, outputBlocks *BlockData, filename string) {
	outputImage := image.NewRGBA(image.Rect(0, 0, sourceImages[0].Width, sourceImages[0].Height))

	for x := 0; x < sourceImages[0].Width; x++ {
		for y := 0; y < sourceImages[0].Height; y++ {
			block := outputBlocks.GetBlock(x / BlockSize, y / BlockSize)

			sR := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x) + block.DtX, float64(y) + block.DtY, 0) / 256
			sG := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x) + block.DtX, float64(y) + block.DtY, 1) / 256
			sB := sourceImages[block.SourceIndex].GetPixelBilinear(float64(x) + block.DtX, float64(y) + block.DtY, 2) / 256

			outputImage.Set(x, y, color.RGBA{uint8(sR), uint8(sG), uint8(sB), 255})
		}
	}

	file, _ := os.Create(filename)
	png.Encode(file, outputImage)
}

func SaveDeltaImage(outputBlocks *BlockData, sourceIndexes []int, filename string) {
	outputImage := image.NewRGBA(image.Rect(0, 0, outputBlocks.Width, outputBlocks.Height))

	for x := 0; x < outputBlocks.Width; x++ {
		for y := 0; y < outputBlocks.Height; y++ {
			block := outputBlocks.GetBlock(x, y)

			sourceIndex := uint8(sourceIndexes[block.SourceIndex])
			dtX := uint8(128 + block.DtX * (1 / BlockFractStep))
			dtY := uint8(128 + block.DtY * (1 / BlockFractStep))

			outputImage.Set(x, y, color.RGBA{sourceIndex, dtX, dtY, 255})
		}
	}

	file, err := os.Create(filename)

	if err != nil {
		log.Fatalf("[error] Cannot create output image")
	}

	png.Encode(file, outputImage)
}

func main() {
	// Command line input
	optImageSources := flag.String("s", "none", "Source JPEG images filenames, indexes")
	optImageTarget := flag.String("t", "none", "Target PNG image filename")
	optImageOutput := flag.String("o", "none", "Output PNG image filename")
	optImageDebug := flag.String("d", "none", "Debug PNG image filename")
	optVerbose := flag.Bool("v", false, "Verbose mode")

	flag.Parse()

	// Load source images (format: "filename|index,filename|index, ...")
	sources := strings.Split(*optImageSources, ",")
	sourceImages := make([]*ImageData, len(sources))
	sourceIndexes := make([]int, len(sources))
	for i := 0; i < len(sources); i++ {
		source := strings.Split(sources[i], "|")
		sourceImages[i] = LoadImageJPEG(source[0])
		sourceIndexes[i], _ = strconv.Atoi(source[1])
	}

	// Load target image
	targetImage := LoadImagePNG(*optImageTarget)

	imageWidth := targetImage.Width
	imageHeight := targetImage.Height

	// Check equal image dimensions
	for i := 0; i < len(sourceImages); i++ {
		if imageWidth != sourceImages[i].Width || imageHeight != sourceImages[i].Height {
			fmt.Fprintf(os.Stderr, "[error] Image dimensions are not equal\n")
			os.Exit(15)
		}
	}

	// Check dimensions divisible by 16
	if math.Mod(float64(imageWidth), BlockSize) != 0 || math.Mod(float64(imageHeight), BlockSize) != 0 {
		fmt.Fprintf(os.Stderr, "[error] Image dimensions must be divisible by 16\n")
		os.Exit(16)
	}

	// Print image info
	fmt.Printf("[info] Size: %dx%d\n", imageWidth, imageHeight)

	// Create delta data
	timeStart := time.Now().UnixNano() / 1e6
	outputBlocks := CreateDelta(sourceImages, targetImage, *optVerbose)
	timeEnd := time.Now().UnixNano() / 1e6
	fmt.Printf("[info] Elapsed time: %d ms\n", timeEnd - timeStart)

	// If defined, save reconstructed image (for comparison)
	if *optImageDebug != "none" {
		SaveReconstructedTarget(sourceImages, outputBlocks, *optImageDebug)
	}

	// Print PSNR, SSIM and save output data
	fmt.Printf("PSNR: %.2fdB\n", GetPSNR(sourceImages, targetImage, outputBlocks))
	fmt.Printf("SSIM: %.3f\n", GetSSIM(sourceImages, targetImage, outputBlocks))

	SaveDeltaImage(outputBlocks, sourceIndexes, *optImageOutput)
}