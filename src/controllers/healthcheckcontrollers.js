import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .staus(200)
        .json(new ApiResponse(200, "ok", "Health check passed"))
})


export {healthcheck}