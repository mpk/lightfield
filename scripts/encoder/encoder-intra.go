/**
 *	Intra frame encoder
 */
package main

import (
	"image/jpeg"
	"image/png"
	"image"
	"bufio"
	"flag"
	"math"
	"fmt"
	"log"
	"os"
)

const ImageChannels = 3

func GetSSIMChannel(inputImage *image.Image, outputImage *image.Image, index int) float64 {
	imageWidth := (*inputImage).Bounds().Max.X
	imageHeight := (*inputImage).Bounds().Max.Y

	iSum := 0.0
	oSum := 0.0

	for x := 0; x < imageWidth; x++ {
		for y := 0; y < imageHeight; y++ {
			i := make([]uint32, 3)
			o := make([]uint32, 3)

			i[0], i[1], i[2], _ = (*inputImage).At(x, y).RGBA()
			o[0], o[1], o[2], _ = (*outputImage).At(x, y).RGBA()

			iSum += float64(i[index])
			oSum += float64(o[index])
		}
	}

	iMean := iSum / float64(imageWidth * imageHeight)
	oMean := oSum / float64(imageWidth * imageHeight)

	iStSum := 0.0
	oStSum := 0.0
	covSum := 0.0

	for x := 0; x < imageWidth; x++ {
		for y := 0; y < imageHeight; y++ {
			i := make([]uint32, 3)
			o := make([]uint32, 3)

			i[0], i[1], i[2], _ = (*inputImage).At(x, y).RGBA()
			o[0], o[1], o[2], _ = (*outputImage).At(x, y).RGBA()

			iStSum += math.Pow(float64(i[index]) - iMean, 2)
			oStSum += math.Pow(float64(o[index]) - oMean, 2)
			covSum += (float64(i[index]) - iMean) * (float64(o[index]) - oMean)
		}
	}

	iStDev := math.Sqrt(iStSum / float64(imageWidth * imageHeight))
	oStDev := math.Sqrt(oStSum / float64(imageWidth * imageHeight))
	cov := covSum / float64(imageWidth * imageHeight)

	C1 := math.Pow(0.01 * 65535.0, 2)
	C2 := math.Pow(0.03 * 65535.0, 2)

	return ((2.0 * iMean * oMean + C1) * (2.0 * cov + C2)) / ((math.Pow(iMean, 2) + math.Pow(oMean, 2) + C1) * (math.Pow(iStDev, 2) + math.Pow(oStDev, 2) + C2))
}

func GetSSIM(inputImage *image.Image, outputImage *image.Image) float64 {
	indexR := GetSSIMChannel(inputImage, outputImage, 0)
	indexG := GetSSIMChannel(inputImage, outputImage, 1)
	indexB := GetSSIMChannel(inputImage, outputImage, 2)

	return (indexR + indexG + indexB) / 3.0;
}

func GetPSNR(inputImage *image.Image, outputImage *image.Image) float64 {
	imageWidth := (*inputImage).Bounds().Max.X
	imageHeight := (*inputImage).Bounds().Max.Y

	mseSum := 0.0

	for x := 0; x < imageWidth; x++ {
		for y := 0; y < imageHeight; y++ {
			iR, iG, iB, _ := (*inputImage).At(x, y).RGBA()
			oR, oG, oB, _ := (*outputImage).At(x, y).RGBA()

			dtR := math.Pow(float64(oR) - float64(iR), 2)
			dtG := math.Pow(float64(oG) - float64(iG), 2)
			dtB := math.Pow(float64(oB) - float64(iB), 2)

			mseSum += dtR + dtG + dtB
		}
	}

	return 20 * math.Log10(65535) - 10 * math.Log10(mseSum / float64(imageWidth * imageHeight * ImageChannels));
}

func LoadImageJPEG(filename string) *image.Image {
	file, err := os.Open(filename)

	if err != nil {
		log.Fatalf("[error] Cannot open %s\n", filename)
	}

	reader := bufio.NewReader(file)
	image, err := jpeg.Decode(reader)

	if err != nil {
		log.Fatalf("[error] Cannot decode %s as JPEG file\n", filename)
	}

	return &image
}

func LoadImagePNG(filename string) *image.Image {
	file, err := os.Open(filename)

	if err != nil {
		log.Fatalf("[error] Cannot open %s\n", filename)
	}

	reader := bufio.NewReader(file)
	image, err := png.Decode(reader)

	if err != nil {
		log.Fatalf("[error] Cannot decode %s as PNG file\n", filename)
	}

	return &image
}

func ConvertImage(inputImage *image.Image, outputFilename string, quality int) {
	// Save destination image
	outputFile, err := os.Create(outputFilename)

	if err != nil {
		log.Fatalf("[error] Cannot create output image")
	}

	jpeg.Encode(outputFile, *inputImage, &jpeg.Options{ quality })
}

func main() {
	optImageInput := flag.String("i", "none", "Input PNG image filename")
	optImageOutput := flag.String("o", "none", "Output JPEG image filename")
	optImageQuality := flag.Int("q", 85, "JPEG quality")

	flag.Parse()

	inputImage := LoadImagePNG(*optImageInput)
	ConvertImage(inputImage, *optImageOutput, *optImageQuality)

	outputImage := LoadImageJPEG(*optImageOutput)
	fmt.Printf("PSNR: %.2fdB\n", GetPSNR(inputImage, outputImage))
	fmt.Printf("SSIM: %.3f\n", GetSSIM(inputImage, outputImage))
}