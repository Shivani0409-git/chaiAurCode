import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
  secure: true
//   secure_distribution: 'mydomain.com',
//   upload_prefix: 'https://api-eu.cloudinary.com'
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("✅ Upload successful!");
        console.log("Public ID:", response.public_id);
        console.log("URL:", response.secure_url);
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        
        return response;

    } catch (error) {
        console.log("❌ Upload failed!", error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}

// v2.uploader.upload("",{
//     public_id: "sample_id",
// })

// cloudinary.v2.uploader
// .upload("dog.mp4", {
//   resource_type: "video", 
//   public_id: "my_dog",
//   overwrite: true, 
//   notification_url: "https://mysite.example.com/notify_endpoint"})
// .then(result=>console.log(result));