var pictures = require('../assets/js/pictures.js');
var domainName = "http://danaia-art.com/"; //end with /
var mainHtml = "___index.html";
var destinationPath = "pictures/";
var siteMapFile = "sitemap.txt";

var sitemap = "";

var cloudinary = "http://res.cloudinary.com/danaia-art/image/upload/";
var cheerio = require('cheerio');
var fs = require('fs');


var siteLangs = {
    "ru": { path: "" , default : true},
    "en": { path: "en/" }
};

function CloudinaryFitHeight(image, limit) {
    return cloudinary + "c_fit,h_" + limit + image;
}

//iterate over site languages
Object.getOwnPropertyNames(siteLangs).forEach( function (l) {
    //generate index.html for each language
    $ = cheerio.load(fs.readFileSync(mainHtml), { decodeEntities: false });
    $("[data-lang!='']").remove("[data-lang!='"+l+"']"); //remove all elements marked with data-lang different from current
    fs.writeFileSync("./" + siteLangs[l].path + 'index.html', $.html());
    sitemap += domainName + siteLangs[l].path + "index.html\n";

    //generate picture pages
    var i = 0;
    pictures.list.forEach(
        function (p) {
            //use decodeEntities=false to keep non escaped non ASCII characters
            var pageUrl = domainName + siteLangs[l].path + "pictures/"  + p.Page + ".html";
            $ = cheerio.load(fs.readFileSync(mainHtml), { decodeEntities: false });
            var pt = p;
            if (!siteLangs[l].default && p[l] != null)
                pt = p[l]; //use localized texts
            $("[data-lang!='']").remove("[data-lang!='"+l+"']"); //remove all elements marked with data-lang different from current
            $("html").attr("lang", l); 
            $("title").text(pt.Title + ' - ' + $("title").text());
            $("#stitle").text(pt.Title);
            $("#sdescr").text(pt.Description);
            $("#simg").attr("src", CloudinaryFitHeight(p.CloudinaryImages[0], 150));
            $("link[rel='canonical']").attr('href', pageUrl);
            $("meta[name='description']").attr('content', pt.Title + "  " + pt.Description);
            $("meta[name='keywords']").attr('content', pt.Title + ',' + pt.Description
                + ',' + $("meta[name='keywords']").attr('content'));
            $("meta[property='og:title']").attr('content',
                pt.Title + ' - ' + $("meta[property='og:title']").attr('content'));
            $("meta[property='og:url']").attr('content', pageUrl);
            $("meta[property='og:type']").attr('content', 'article');
            $("meta[property='og:description']").attr('content', pt.Title + "  " + pt.Description);
            $("meta[property='og:image']").attr("content", CloudinaryFitHeight(p.CloudinaryImages[0], 150));

            $("meta[itemprop='name']").attr('content',
                p.Title + ' - ' + $("meta[itemprop='name']").attr('content'));
            $("meta[itemprop='url']").attr('content', pageUrl);
            $("meta[itemprop='description']").attr('content', pt.Title + "  " + pt.Description);
            $("meta[itemprop='thumbnailUrl']").attr("content", CloudinaryFitHeight(p.CloudinaryImages[0], 150));
            $("link[rel='image_src']").attr("href", CloudinaryFitHeight(p.CloudinaryImages[0], 800));
            $("meta[itemprop='image']").attr("content", CloudinaryFitHeight(p.CloudinaryImages[0], 800));

            $("meta[name='twitter:title']").attr('content',
                pt.Title + ' - ' + $("meta[name='twitter:title']").attr('content'));
            $("meta[name='twitter:url']").attr('content', pageUrl);
            $("meta[name='twitter:description']").attr('content', pt.Title + "  " + pt.Description);
            $("meta[name='twitter:image']").attr("content", CloudinaryFitHeight(p.CloudinaryImages[0], 150));

            //$("#picture-viewer").css('display','block');
            //$('#large').css ("backgroundImage",'url('+p.PicasaImages[0]+"s"+730+"/"+')');            
            //$("#viewer-description").text(p.Description);
            //$("#viewer-fragment-description").text('');
            fs.writeFileSync("./" + siteLangs[l].path   + destinationPath  + p.Page + '.html', $.html());
            sitemap += pageUrl + "\n";
            i++;
        }); //pictures iteration
        
        console.log("Language: '"+l +"': " +i + " picture pages generated");
    }        
); //siteLangs iteration

fs.writeFileSync(siteMapFile, sitemap);
process.exit(0);