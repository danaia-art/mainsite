var fs = require('fs');
var pictures = [];
var new_pictures = require ('./new.js');
var cloudinary = require('cloudinary');
var cloudinaryPfx ="https://res.cloudinary.com/danaia-art/image/upload"; //!use secure prefix without last slash

var started = 0;
var finished = 0;

var upload_options = { folder: "published", 
            transformation: { height: 1200, crop: "limit" }
 };

cloudinary.config({ 
  cloud_name: 'danaia-art',
  api_key: '<INSERT YOUR KEY>',
  api_secret: '<INSERT YOUR KEY>'
});

new_pictures.list.forEach(
        function (p)
        {
            if (p.LocalImages == null ) return;
            p.CloudinaryImages = [];
            started++;
            var lic = p.LocalImages.length;
            var luc = 0;
            p.LocalImages.forEach ( function(u,i){                                  
                 console.log("Upload "+u);
                cloudinary.v2.uploader.upload(u, upload_options, 
                    function(error, result) { 
                        console.log("Finish upload "+u);
                        if (error) {
                            console.log(error);
                            return;
                        }
                        console.log(result);
                        p.CloudinaryImages[i]=result.secure_url.slice(cloudinaryPfx.length);
                        luc++;
                        if (luc < lic) return;
                        delete p.LocalImages;
                        pictures.unshift(p);                    
                        finished++;                    
                        if (finished < new_pictures.list.length ) return;                    
                        //TODO convert file to utf-8 and and module code
                        fs.writeFileSync('pictures_new.json',JSON.stringify(pictures), {encoding:"utf8"});
                        process.exit(0);                              
                });
            });            
        }
    );

