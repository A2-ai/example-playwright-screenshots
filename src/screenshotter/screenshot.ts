import { existsSync } from "fs";
import { Page } from "@playwright/test";
import { addTimestamp } from "./utils";
const leftPad = require('left-pad')
const sharp = require("sharp");

interface SavedScreenshot {
    name: string;
    timestamp: Date;
    description: string;
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

  page: Page;


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
    page: Page,
    startingCounter: number = 1,
  ) {
    this.page = page;
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
   * @param description - A description of the screenshot.
   * @param diagnostic - If true, takes a diagnostic screenshot; otherwise, takes a regular screenshot.
   * @param page - The Playwright page object to take a screenshot of.
   */
  async takeScreenshot(description: string,diagnostic: boolean = false,  page: Page | undefined) {
    const screenshotPage = page != undefined ? page : this.page;
    let savedScreenshot = await this.storeScreenshot(description, diagnostic, screenshotPage); 
    let screenshotType = diagnostic ? "diagnostic" : "screenshot";
    addTimestamp(
      savedScreenshot.buffer,
      `${this.identifier} - ${screenshotType} ${savedScreenshot.counter}`,
      savedScreenshot.timestamp.toISOString(),
      savedScreenshot.description
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
            screenshot.timestamp.toISOString(),
            screenshot.description
        )
            .then((buffer) => sharp(buffer).toFile(screenshot.name))
            .catch((err) => console.error(err));
    }
  }

  /**
   * Stores a screenshot in memory for later saving. This is useful if you want to
   * take a screenshot and then do something else with the page before saving it.
   * 
   * @param description - A description of the screenshot.
   * @param diagnostic - If true, takes a diagnostic screenshot; otherwise, takes a regular screenshot.
   * @param page - The Playwright page object to take a screenshot of.
   * @returns A `SavedScreenshot` object containing the screenshot information.
   */
  async storeScreenshot(description: string,diagnostic: boolean = false,  page: Page | undefined = undefined) {
    const screenshotPage = page != undefined ? page : this.page;
    let name: string, timestamp: Date;
    if (diagnostic) {
     ({name, timestamp } = this.getNextDiagnosticScreenshotPathName());
    } else {
     ({name, timestamp } = this.getNextScreenshotPathName());
    }
    const buffer = await screenshotPage.screenshot();
    let counter = diagnostic ? this.diagnosticCounter : this.counter;
    let result: SavedScreenshot = {name, timestamp, buffer, diagnostic, counter: counter, description: description};
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
