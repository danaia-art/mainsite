'use strict';

var galleryApp = (function(){

    var byId = [], byCategory = [];

    var cloudinaryPfx ="https://res.cloudinary.com/danaia-art/image/upload/";

    function CloudinaryFit(image, limit)
    {
        return cloudinaryPfx+"c_fit,h_"+limit+",w_"+limit+image;
    }

    function CloudinaryFitHeight(image, limit)
    {
        return cloudinaryPfx+"c_limit,h_"+limit+image;
    }

    function getCategoryTitle (category){
        var el = document.getElementById(category);
        if (el == null) return "";
        el = el.getElementsByTagName("h2");
        if (el == null) return "";
        var t = el[0].innerText;
        if (t == null || t == "") return "Галерея";
        else return t;
    
    }

    function getUrlParameters(locationObj)
    {
        var url=null;
        var result = {};

        var pictureIdx = locationObj.pathname.indexOf('/pictures/');


        if (locationObj.pathname == "" || location.pathname == "/")
        {
        }
        else if (pictureIdx >= 0 )
        {
            url=location.pathname.slice(pictureIdx + 10);
            if (url.endsWith(".html")) url=url.slice(0,-5);
            result["picture"]=url;
        }

        url=locationObj.search+locationObj.hash;

        if (url.substr(0,2) == "#!" ) url = url.slice(2);
        else if (url.substr(0,1) =="#") url = url.slice(1);
        else if (url.substr(0,1) =="?") url = url.slice(1);

        var sURLVariables = url.split('&');

        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            result[sParameterName[0]]=sParameterName[1];
        }
        return result;
    }

    function showGallery(category, picture , onPopState){        
        var title = getCategoryTitle(category);
        var index = 0;
        var collection = byCategory[category];
        if (picture != null)
            for (var i = 0; i<collection.length; i++)
                if (collection[i] == picture) {
                    index = i;
                    break;
                }
        var el = document.getElementById(category);
        
        if (onPopState) //when user press back button
            window.lgData[el.getAttribute('lg-uid')].slide(index);
        else
            lightGallery(el, { dynamic: true,
                dynamicEl: collection,
                hideBarsDelay: 2000,
                closable: false,
                download: false,
                enableDrag: false,
                escKey: false ,
                index: index, 
                title: title,
                category: category     
                });
    }
    
    function route (category, onPopState)
    {
        var urlParams = getUrlParameters(window.location);
        var picture = byId[urlParams.picture];

        if (category == null ) //try get category from url
            category = urlParams.category;

        if (byCategory[category] == null) //actually no category exists
                category = null;
        
        if (category == null && picture !=null) //try get category from picture
            category = picture.Categories[0];

        if (category == null || category == "") 
        {
            //TODO: find current gallery and hide
            return;
        }
                   
        showGallery(category , picture , onPopState );
    }

    function userLanguage ()
    {
        var language = window.navigator.userLanguage || window.navigator.language;
        if (language == null ) return "ru";
        if (language.indexOf("ru") >= 0 ) return "ru";
        else return "en";
    }

    function requestedLanguage()
    {
        try {
            if (window.location.pathname.startsWith("/en/")) return "en";
        }
        catch (err)
        {}        
        return "default";
    }

  

    return {

        requestedLanguage:  requestedLanguage,

        showFragment: function (p, fragment, animation)
        {
            if (animation == null) animation = true;
            var picture = byId[p];
            if (picture == null) return;
            if (picture.CloudinaryImages.length <= fragment ) return;
            var lgCurrent = document.querySelector(".lg-current");
            if (lgCurrent == null || lgCurrent.children[0] == null) 
               return;          
                //throw new Error ("Smth is wrong with Lightgallery #100");            
            
            lgCurrent = lgCurrent.children[0];
            var imgCurrent = null;
            if (lgCurrent.children.length == 1)
            {
                imgCurrent = lgCurrent.children[0];
                imgCurrent.setAttribute ("data-fragment-current", "true");
                imgCurrent.setAttribute ("data-fragment-index", "0");
            }
            else
            {
                imgCurrent = lgCurrent.querySelector("[data-fragment-current='true']");
            }

            var imgUpcoming = lgCurrent.querySelector("[data-fragment-index='"+fragment+"']");
            if (imgCurrent == imgUpcoming) return;
            
            if (imgUpcoming == null)
            {
                var imgSrc = CloudinaryFitHeight(picture.CloudinaryImages[fragment],800);    
                imgUpcoming = imgCurrent.cloneNode();
                imgUpcoming.setAttribute('src',imgSrc);  
                imgUpcoming.setAttribute ("data-fragment-index", fragment);
                utils.addClass(imgUpcoming, 'fragment-load');
                lgCurrent.appendChild(imgUpcoming);
            }

            imgCurrent.setAttribute ("data-fragment-current", "false");
            imgUpcoming.setAttribute ("data-fragment-current", "true");

            //do operation async to avoid delay when scroll to next picture
            setTimeout ( function (){                
                utils.addClass(imgCurrent, 'fragment-hide');
                utils.removeClass(imgUpcoming, 'fragment-hide');            
                utils.addClass(imgUpcoming, 'fragment-show');
            } , 1);

        },

        getItemLocation: function (p)
        {
             var path="";
             var l = requestedLanguage();
             if ( l!="default" ) path = "/"+l;             
             path += "/pictures/" +p.Page+ ".html";
             return path;
        },

        getHomeLocation: function ()
        {
            var l = requestedLanguage();
            if ( l == "default") return "/";
            else return "/"+l+"/";
        },

        init: function () {

            var lang = requestedLanguage();

            pictures.list.forEach(
                function (p) {
                    byId[p.Page] = p;
                    if (!p.Categories) return;
                    p.Categories.forEach( function (c) {
                        var cl =byCategory[c];
                        if (!cl) {
                            cl = [ p ];
                            byCategory [c] = cl;
                        }
                        else
                            cl.push (p);
                    });
                    
                    //add light gallery specific attributes to picture object
                    p.src = CloudinaryFitHeight(p.CloudinaryImages[0],800);
                    //p.thumb = CloudinaryFitHeight(p.CloudinaryImages[0],700);

                    p.subHtml = "";

                    for (var j=0; p.CloudinaryImages.length > 1 && j<p.CloudinaryImages.length; j++)
                    p.subHtml+=
                        "<a href='javascript:galleryApp.showFragment("+p.Page+","+j+");'> <img src='"+
                            CloudinaryFitHeight(p.CloudinaryImages[j],50)+"'></a>";
                    
                    var title = p.Title;
                    var descr = p.Description;

                    if (lang != "default" && p[lang] != null)
                    {
                        if ( p[lang].Title ) title = p[lang].Title;
                        if ( p[lang].Description ) descr = p[lang].Description;
                    }
                    
                    p.subHtml  += '<h2>' + title + '</h2><p>'+ descr +'</p>';
            });


         window.addEventListener("popstate", function(e){ route(null, true); });
         
         route();
    },

    route: route    
    }; 
})();