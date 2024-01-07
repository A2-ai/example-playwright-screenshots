import { existsSync } from "fs";
import { Page } from "@playwright/test";
const sharp = require("sharp");
const { createCanvas, loadImage } = require("canvas");
const leftPad = require('left-pad')

async function addTimestamp(imageBuffer, testid, timestamp, fontSize = 20) {
  const image = await sharp(imageBuffer).metadata();
  const padding = 5;
  const textHeight = fontSize + padding * 2; // Height of text area
  const lineThickness = 1; // Thickness of the dividing line

  // Create a canvas with the new dimensions
  const canvas = createCanvas(
    image.width,
    image.height + textHeight + lineThickness
  );
  const context = canvas.getContext("2d");

  // Draw original image onto the canvas
  const originalImage = await loadImage(imageBuffer);
  context.drawImage(
    originalImage,
    0,
    textHeight + lineThickness,
    image.width,
    image.height
  );

  // Draw white background for text
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, image.width, textHeight);

  // Draw dividing line
  context.fillStyle = "#000000"; // Change line color if needed
  context.fillRect(0, textHeight, image.width, lineThickness);

  // Draw text
  context.fillStyle = "#000000"; // Text color
  context.font = `${fontSize}px Arial`;
  context.fillText(
    timestamp,
    image.width - context.measureText(timestamp).width - padding,
    fontSize + padding
  );
  context.fillText(testid, 10, fontSize + padding);

  return sharp(canvas.toBuffer()).png().toBuffer();
}

interface SavedScreenshot {
    name: string;
    timestamp: Date;
    buffer: Buffer;
    diagnostic: boolean;
    counter: number;
}

/**
 * The `Screenshotter` class provides functionality for taking, storing, and managing screenshots
 * during automated tests. It supports both regular and diagnostic screenshots.
 */
export class Screenshotter {
  /**
   * Counter for the index for regular screenshots
   */
  counter: number;

  /**
   * Counter for diagnostic screenshots.
   */
  diagnosticCounter: number;

  /**
   * Identifier for the screenshots.
   */
  identifier: string;

  /**
   * Directory where screenshots will be stored.
   */
  directory: string;

  /**
   * Array to store saved screenshots. This can be used
   * to flush the screenshots at the end of a test so it is known how many
   * total were taken, instead of saving them as soon as invoked.
   */
  private savedScreenshots: SavedScreenshot[];
  /**
   * Constructs a new `Screenshotter` instance.
   * 
   * @param identifier - A unique identifier for the screenshots.
   * @param screenshotDirectory - The directory where screenshots will be saved.
   * @param startingCounter - The starting counter for screenshot numbering, defaulting to 1.
   * @throws {Error} If the specified screenshot directory does not exist.
   */
  constructor(
    identifier: string,
    screenshotDirectory: string,
    startingCounter: number = 1
  ) {
    this.identifier = identifier;
    // each time a count is requested its incremented first, so we need to start the counter
    // at one less than the starting counter since it'll be incremented
    this.counter = startingCounter - 1;
    this.diagnosticCounter = startingCounter - 1;
    if (!existsSync(screenshotDirectory)) {
      throw new Error(
        `Screenshot directory ${screenshotDirectory} does not exist`
      );
    }
    this.directory = screenshotDirectory;
    this.savedScreenshots = [];
  }
    /**
   * Takes a screenshot of the provided page.
   * 
   * @param page - The Playwright page object to take a screenshot of.
   * @param diagnostic - If true, takes a diagnostic screenshot; otherwise, takes a regular screenshot.
   */
  async takeScreenshot(page: Page, diagnostic: boolean = false) {
    let savedScreenshot = await this.storeScreenshot(page, diagnostic); 
    let screenshotType = diagnostic ? "diagnostic" : "screenshot";
    addTimestamp(
      savedScreenshot.buffer,
      `${this.identifier} - ${screenshotType} ${savedScreenshot.counter}`,
      savedScreenshot.timestamp
    )
      .then((buffer) => sharp(buffer).toFile(savedScreenshot.name))
      .catch((err) => console.error(err));
  }

  /**
   * Saves all stored screenshots in the screenshotDirectory using the pattern
   * `identifier-${padded screenshot number}-${timestamp}.png`.
   */
  async saveStoredScreenshots() {
    const totalDiagnosticScreenshots = this.savedScreenshots.filter((screenshot) => screenshot.diagnostic).length;
    const totalScreenshots = this.savedScreenshots.length - totalDiagnosticScreenshots;
    for (const screenshot of this.savedScreenshots){
        let screenshotType = screenshot.diagnostic ? "diagnostic" : "screenshot";
        await addTimestamp(
            screenshot.buffer,
            `${this.identifier} - ${screenshotType} ${screenshot.counter} of ${screenshot.diagnostic ? totalDiagnosticScreenshots : totalScreenshots}`,
            screenshot.timestamp
        )
            .then((buffer) => sharp(buffer).toFile(screenshot.name))
            .catch((err) => console.error(err));
    }
  }

  /**
   * Stores a screenshot in memory for later saving. This is useful if you want to
   * take a screenshot and then do something else with the page before saving it.
   * 
   * @param page - The Playwright page object to take a screenshot of.
   * @param diagnostic - If true, takes a diagnostic screenshot; otherwise, takes a regular screenshot.
   * @returns A `SavedScreenshot` object containing the screenshot information.
   */
  async storeScreenshot(page: Page, diagnostic: boolean = false) {
    let name: string, timestamp: Date;
    if (diagnostic) {
     ({name, timestamp } = this.getNextDiagnosticScreenshotPathName());
    } else {
     ({name, timestamp } = this.getNextScreenshotPathName());
    }
    const buffer = await page.screenshot();
    let counter = diagnostic ? this.diagnosticCounter : this.counter;
    let result: SavedScreenshot = {name, timestamp, buffer, diagnostic, counter: counter};
    this.savedScreenshots.push(result);
    return result 
  }
 
  private getNextScreenshotPathName() {
    const timestamp = new Date()
    this.counter = this.counter + 1;
    let name = `${this.directory}/${this.identifier}-${leftPad(this.counter, 2, '0')}-${timestamp.toISOString()}.png`;
    return { name, timestamp };
  }
  private getNextDiagnosticScreenshotPathName() {
    const timestamp = new Date();
    this.diagnosticCounter = this.diagnosticCounter + 1;
    let name = `${this.directory}/diagnostic-${this.identifier}-${
        leftPad(this.diagnosticCounter, 2, '0') 
    }-${timestamp.toISOString()}.png`;
    return {name, timestamp}
  }
}
