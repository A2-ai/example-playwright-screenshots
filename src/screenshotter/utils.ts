const { createCanvas, loadImage } = require("canvas");
const sharp = require("sharp");

export async function addTimestamp(imageBuffer, testid: string, timestamp: string, description: string, fontSize = 20, descriptionFontSize = 16) {
    const image = await sharp(imageBuffer).metadata();
    const padding = 5;
    const topTextHeight = fontSize + padding * 2; // Height of text area
    let descriptionTextHeight = descriptionFontSize + padding * 2; // Height of text area
    const lineThickness = 1; // Thickness of the dividing line
    // Create a canvas with the new dimensions, can't be const since might
    // need to create a new canvas after figuring out line sizing
    let canvas = createCanvas(
      image.width,
      // this will only work if description is a single line,
      // so after getting the lines, we'll need to assess if the canvas needs to be taller
      // want 2 dividing lines, one between the image and the top text, and one between the image and the description
      image.height + topTextHeight + descriptionTextHeight + lineThickness * 2
    );
    let context = canvas.getContext("2d");
    // setting the original font size to be the line sizes we need for the description
    // so getLines context understands the size of the lines
    context.font = `${fontSize}px Arial`;
    const lines = getLines(context, description, image.width - 20)

    if (lines.length > 1) {
        descriptionTextHeight = descriptionTextHeight + (descriptionFontSize * lines.length - 1) 
        canvas = createCanvas(
            image.width,
            // this will only work if description is a single line,
            // so after getting the lines, we'll need to assess if the canvas needs to be taller
            // for math we need the descriptionTextHeight, which includes padding, then the fontsize * number of lines for
            // extra lines
            image.height + topTextHeight + descriptionTextHeight + lineThickness
          );
        context = canvas.getContext("2d");
    }

  
    // Draw original image onto the canvas
    const originalImage = await loadImage(imageBuffer);
    context.drawImage(
      originalImage,
      0,
      topTextHeight + lineThickness,
      image.width,
      image.height
    );
  
    // Draw white background for text
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, image.width, topTextHeight);
  
    // Draw dividing line
    context.fillStyle = "#000000"; // Change line color if needed
    context.fillRect(0, topTextHeight, image.width, lineThickness);
  
    // Draw header text
    context.fillStyle = "#000000"; // Text color
    context.font = `${fontSize}px Arial`;
    context.fillText(
      timestamp,
      image.width - context.measureText(timestamp).width - padding,
      fontSize + padding
    );
    context.fillText(testid, 10, fontSize + padding);

     // Draw desciption dividing line
     context.fillStyle = "#000000"; // Change line color if needed
     context.fillRect(0, image.height + topTextHeight + lineThickness, image.width, lineThickness);

    // Draw white background for text
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, image.height + topTextHeight + lineThickness * 2, image.width, descriptionTextHeight);
        // Draw header text
        context.fillStyle = "#000000"; // Text color
        context.font = `${fontSize}px Arial`;
        context.fillText(
          description,
          10,  
          image.height + topTextHeight + lineThickness + padding + descriptionFontSize
        );
  
    return sharp(canvas.toBuffer()).png().toBuffer();
  }

/**
 * 
 * @param ctx node canvas context
 * @param text text to wrap 
 * @param maxWidth max line width
 * @returns 
 */
export function getLines(ctx, text: string, maxWidth: number) {
    var words = text.split("\n");
    return words;
    //var lines: string[] = [];
    // var currentLine = words[0];

    // for (var i = 1; i < words.length; i++) {
    //     var word = words[i];
    //     var width = ctx.measureText(currentLine + " " + word).width;
    //     if (width < maxWidth) {
    //         currentLine += " " + word;
    //     } else {
    //         lines.push(currentLine);
    //         currentLine = word;
    //     }
    // }
    // lines.push(currentLine);
    //return lines;
}