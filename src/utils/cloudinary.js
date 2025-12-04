import { v2 } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure_distribution: 'mydomain.com',
  upload_prefix: 'https://api-eu.cloudinary.com'
});


const uploadToCloudinary = async function(localpath){
    try {
        if(!localpath) return null;
        const resp = await v2.uploader.upload(
            localpath, 
            {resource_type: "auto"}
        )
        console.log("file uploaded on Cloudinary:", resp.url);
        return resp;
    } catch (error) {

        fs.unlinkSync(localpath) // delete the locally saved tempery file as the upload operation failed
    }
}

export {uploadToCloudinary};

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