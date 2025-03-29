import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import dotenv from "dotenv"


dotenv.config()

// Configuration for cloudinary
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


const uploadOnCloudinary = async (localfilePath) => {
        try {
            if (!localfilePath) return null
            const response = await cloudinary.uploader.upload(
                localfilePath, {
                    resource_type: "auto"
                }
            )
            console.log("File uploaded on cloudinary. file src: " + response.url)
            //once the file is uploaded, we would like to delete from our server

            fs.unlinkSync(localfilePath)
            return response
            
        } catch (error) {
            fs.unlinkSync(localfilePath)
            return null
        }
}
 
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. Public id")
    } catch (error) {
        console.log("Error deleting from cloudinary", error)
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}