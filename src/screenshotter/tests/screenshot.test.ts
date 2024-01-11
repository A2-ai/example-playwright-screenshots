import * as fs from "fs"
import * as path from "path"

import { addTimestamp } from "../utils"
const sharp = require("sharp");
const screenshotBuffer = fs.readFileSync(path.join(__dirname, "testdata", "SCR-20240110-icmq.png"))
const { describe, it } = require('node:test');
describe("addTimestamp", () => {
    it("adds a single line description", async () => {
        const timestamp = new Date("2024-01-10T12:00:00Z")
        const result = await addTimestamp(screenshotBuffer, "test", timestamp.toISOString(),
      "here is a description of a test file that should only be on a single line")
        await sharp(result).toFile(path.join(__dirname, "testdata", "SCR-20240110-icmq-timestamped.png"))
    })

    it("adds a multi line description", async () => {
        const timestamp = new Date("2024-01-10T12:00:00Z")
        const result = await addTimestamp(screenshotBuffer, "test", timestamp.toISOString(),
      `here is a description of a test file that should take up more than one line
2 here is a description of a test file that should take up more than one line
3 here is a description of a test file that should take up more than one line      
      `)
        await sharp(result).toFile(path.join(__dirname, "testdata", "SCR-20240110-icmq-multiline-timestamped.png"))
    })
})

