var fs = require('fs');
var pictures = require ('./pictures.js');
var cloudinary = require('cloudinary');

var started = 0;
var finished = 0;

cloudinary.config({ 
  cloud_name: 'danaia-art', 
  api_key: '<INSERT YOUR KEY>', 
  api_secret: '<INSERT YOUR KEY>' 
});

pictures.list.forEach(
        function (p)
        {
            if (p.PicasaImages == null ) return;
            p.CloudinaryImages = [];
            
            p.PicasaImages.forEach ( function(u,i){
                 u = u+"s0" + (p.PicasaSize == null ? "": p.PicasaSize) +"/";
                 started++;
                 console.log("Start upload "+u);
                 console.log(started);
                cloudinary.uploader.upload(u, function(result) { 
                    console.log("Finish upload "+u);
                    console.log(result);
                    p.CloudinaryImages[i]=result.secure_url;
                    //p.CloudinaryImages[i]=u;
                    finished++;                    
                    console.log("Finished: "+finished);          
                    if (finished == 162 )
                    {
                        fs.writeFileSync('pictures_new.json',JSON.stringify(pictures.list));
                        process.exit(0);
                    }          
                });
            });            
        }
    );

