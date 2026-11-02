const fs = require("fs/promises");
const path = require("path");
const moment = require("moment");

const logError = async (res , error , controller) => {
    try {
        const timestamp = moment().format("YYYY-MM-DD hh:mm:ss");
        const folderPath = path.join(__dirname, "../../logs"); // root folder of logs

        const filename = `Err${controller}_${moment().format("DD-MM-YYYY")}.txt`; // log file name with current date
        const filePath = path.join(folderPath, filename);
        // Create "logs" folder if missing
        await fs.mkdir(folderPath, { recursive: true }); // create folder if not exist
        const logMessage = `[${timestamp}] ${error}\n`;

        await fs.appendFile(filePath, logMessage);

    } catch (error) {
        console.error("Error writing to log file:", error);
    }

    res.status(500).send({
        message: "Internal Server Error/nplease contach I.T Team to support",
        isSuccess: false
    });
};

module.exports = logError;