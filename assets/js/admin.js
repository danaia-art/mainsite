'use strict';

const adminApp = (function(){

  const siteUrl = "https://danaia-art.com/"
  const cloud = 'danaia-art'
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`
  const cloudinaryPrefix = `https://res.cloudinary.com/${cloud}/image/upload/`

  const languages = [
     { lang: "ru", path: "" , default : true},
     { lang: "en", path: "en/" }
  ];

  const previewLimit = 300
  const categorySeparators = " "
  let repoToken = null
  let cloudinaryToken = null
  let pictures = null
  let lastId = null
  let currentPicture = -1


  function cloudinaryImagePreview(imagePath) {
    return cloudinaryPrefix+"c_fit,h_"+previewLimit+",w_"+previewLimit+imagePath;
  }

  function cloudinaryFitHeight(imagePath, limit) {
    return cloudinaryPrefix + "c_fit,h_" + limit + imagePath;
  }


  function handleError(error) {
    console.error(error)
    document.getElementById("errorCaption").innerText = `Error ${error.message}`
    document.getElementById("errorText").innerText = error.stack
    document.getElementById("errorForm").style.display = "block"
  }

  function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", cloudinaryToken)
    return fetch(cloudinaryUrl, { method: "POST", body: formData})
        .then (response => response.json())
        .then (result => result.secure_url.slice(cloudinaryPrefix.length))
  }

  function initPicturesList() {
    storage.init(repoToken)
    return storage.getPictureList()
        .then(picturesList => pictures = picturesList)
        .catch(error => handleError(error))
  }

  function showCurrentPicture() {
    const picture = pictures.list[currentPicture]
    document.getElementById("pictureIdInput").value = picture.Page
    document.getElementById("titleInput").value = picture.Title
    document.getElementById("titleInputEN").value = picture.en.Title
    document.getElementById("descriptionInput").value = picture.Description
    document.getElementById("descriptionInputEN").value = picture.en.Description
    document.getElementById("categoriesInput").value = picture.Categories.join(" ")
    document.getElementById("fileInput").value = ""
    document.getElementById("previewImage").src = cloudinaryImagePreview(picture.CloudinaryImages[0])
    document.getElementById("pictureFormFieldset").disabled = false
    document.getElementById("pictureForm").style.display = "block"
  }

  function nextPictureClick(step) {
    document.getElementById("pictureFormFieldset").disabled = true
    const newCurrentPicture = currentPicture + step
    if (newCurrentPicture < 0) currentPicture = pictures.list.length - 1
    else if (newCurrentPicture >= pictures.list.length) currentPicture = 0
    else currentPicture = newCurrentPicture
    showCurrentPicture()
  }

  function init() {
    pictures = null
    lastId = null
    currentPicture = -1
    repoToken = localStorage.getItem("repoToken")
    cloudinaryToken = localStorage.getItem("cloudinaryToken")
    const tokensForm = document.getElementById("tokensForm")
    const topPanel = document.getElementById("topPanel")
    const pictureForm = document.getElementById("pictureForm")
    if (repoToken == null || repoToken === "" || cloudinaryToken == null || cloudinaryToken === "") {
      topPanel.style.display = "none"
      pictureForm.style.display = "none"
      tokensForm.style.display = "block"
    } else  {
      topPanel.style.display = "block"
      tokensForm.style.display = "none"
      initPicturesList()
          .then(_ => nextPictureClick(1))

    }
    document.getElementById("errorForm").style.display = "none"
  }

  function submitTokensForm() {
    const repoTokenInput = document.getElementById("repoTokenInput")
    const newRepoToken = repoTokenInput.value.trim()
    const cloudinaryTokenInput =document.getElementById("cloudinaryTokenInput")
    const newCloudinaryToken = cloudinaryTokenInput.value.trim()
    if (newRepoToken === "" || newCloudinaryToken === "") return
    document.getElementById("tokensForm").style.display = "none"
    document.getElementById("topPanel").style.display = "block"
    repoTokenInput.value = ""
    cloudinaryTokenInput.value = ""
    localStorage.setItem("repoToken", newRepoToken)
    repoToken = newRepoToken
    localStorage.setItem("cloudinaryToken", newCloudinaryToken)
    cloudinaryToken = newCloudinaryToken
    initPicturesList()
        .then(_ => nextPictureClick(1))
  }

  function logoutClick() {
    localStorage.removeItem("repoToken")
    repoToken = null
    localStorage.removeItem("cloudinaryToken")
    cloudinaryToken = null
    init()
  }

  function newPictureClick() {
    document.getElementById("pictureIdInput").value = ""
    document.getElementById("titleInput").value = ""
    document.getElementById("titleInputEN").value = ""
    //document.getElementById("descriptionInput").value = ""
    //document.getElementById("descriptionInputEN").value = ""
    document.getElementById("fileInput").value = ""
    const categoriesInput = document.getElementById("categoriesInput")
    if (categoriesInput.value === "") categoriesInput.value = (new Date()).getFullYear()
    document.getElementById("pictureFormFieldset").disabled = false
    document.getElementById("previewImage").src = ""
    document.getElementById("pictureForm").style.display = "block"
    currentPicture = - 1
  }

  function formPageUrl(langPath,page) {
    return `${siteUrl}${langPath}pictures/${page}.html`
  }

  function generateSitemap() {
    const pageList = languages.flatMap(lang =>
      pictures.list.map(picture => {
        return  formPageUrl(lang.path, picture.Page)
      })
    ).concat(
        languages.map (lang => `${siteUrl}${lang.path}index.html`)
    )
    const siteMap = pageList.join("\n")
    return {
      path: "sitemap.txt",
      content: siteMap
    }
  }

  function generateMainPage(template, language) {
    const domParser = new DOMParser()
    const doc = domParser.parseFromString(template,"text/html")
    const items = doc.querySelectorAll(`:not([data-lang=${language.lang}])`)
    items.forEach(item => {
      if (item.attributes["data-lang"] != null ) item.remove()
    })
    doc.querySelector("html").lang = language.lang
    const xmlSerializer = new XMLSerializer()
    const html = xmlSerializer.serializeToString(doc)
    return {
      path: `${language.path}index.html`,
      content: html
    }
  }

  function generatePicturePage(template, language, picture) {
    const props = (language.default === true || picture[language.lang] == null) ? picture : picture[language.lang]
    const domParser = new DOMParser()
    const doc = domParser.parseFromString(template,"text/html")
    const items = doc.querySelectorAll(`:not([data-lang=${language.lang}])`)
    items.forEach(item => {
      if (item.attributes["data-lang"] != null ) item.remove()
    })
    doc.querySelector("html").lang = language.lang
    const smallPreviewImage = cloudinaryFitHeight(picture.CloudinaryImages[0], 150)
    const bigPreviewImage = cloudinaryFitHeight(picture.CloudinaryImages[0], 800)
    const pageUrl = formPageUrl(language.path, picture.Page)
    doc.querySelector("title").innerText = `${props.Title} - ${doc.querySelector("title").innerText}`
    doc.querySelector("#stitle").innerText = props.Title
    doc.querySelector("#sdescr").innerText = props.Description
    doc.querySelector("#simg").src = smallPreviewImage
    doc.querySelector("link[rel='canonical']").href = pageUrl
    doc.querySelector("meta[name='description']").content = `${props.Title} ${props.Description}`;
    const metaKeywords = doc.querySelector("meta[name='keywords']")
    metaKeywords.content = `${props.Title},${props.Description},${metaKeywords.content}`
    const metaTitle = doc.querySelector("meta[property='og:title']")
    metaTitle.content = props.Title + ' - ' + metaTitle.content
    doc.querySelector("meta[property='og:url']").content = pageUrl
    doc.querySelector("meta[property='og:type']").content= 'article'
    doc.querySelector("meta[property='og:description']").content = props.Title + "  " + props.Description
    doc.querySelector("meta[property='og:image']").content = smallPreviewImage;
    const metaName =doc.querySelector("meta[itemprop='name']")
    metaName.content = picture.Title + ' - ' + metaName.content
    doc.querySelector("meta[itemprop='url']").content = pageUrl
    doc.querySelector("meta[itemprop='description']").content = props.Title + "  " + props.Description
    doc.querySelector("meta[itemprop='thumbnailUrl']").content = smallPreviewImage
    doc.querySelector("link[rel='image_src']").href = bigPreviewImage
    doc.querySelector("meta[itemprop='image']").content = bigPreviewImage
    const twitterTitle = doc.querySelector("meta[name='twitter:title']")
    twitterTitle.content = props.Title + ' - ' + twitterTitle.content
    doc.querySelector("meta[name='twitter:url']").content = pageUrl
    doc.querySelector("meta[name='twitter:description']").content = props.Title + "  " + props.Description
    doc.querySelector("meta[name='twitter:image']").content = smallPreviewImage
    const xmlSerializer = new XMLSerializer()
    const pictureHtml = xmlSerializer.serializeToString(doc)
    return {
      path: `${language.path}pictures/${picture.Page}.html`,
      content: pictureHtml
    }
  }

  function generateFiles(pictureList) {
    return storage.getTemplatePage()
        .then(template => {
            return languages.flatMap(language => {
              return pictureList.map(picture => generatePicturePage(template, language, picture))
            })
        }).then (pictureFiles => {
          const picturesJson = {
            path: storage.picturesJson,
            content:  JSON.stringify(pictures.list, null, 4)
          }
          const otherFiles = [ generateSitemap() , picturesJson ]
          const allFiles = pictureFiles.concat(otherFiles)
          return allFiles
        })
  }

  function lastPictureId() {
    return pictures.list.map(p => picture.Page).max()
  }

  function submitPictureForm() {
    const pictureIdInput = document.getElementById("pictureIdInput")
    const titleInput = document.getElementById("titleInput")
    const titleInputEN = document.getElementById("titleInputEN")
    const descriptionInput = document.getElementById("descriptionInput")
    const descriptionInputEN = document.getElementById("descriptionInputEN")
    const categoriesInput = document.getElementById("categoriesInput")
    const fileInput = document.getElementById("fileInput")

    const newPicture = {
      Page: (currentPicture === - 1) ? (lastPictureId() + 1).toString() : pictureIdInput.value,
      Title: titleInput.value.trim(),
      Description: descriptionInput.value.trim(),
      Categories: categoriesInput.value.split(categorySeparators)
          .map(c => c.trim())
          .filter(c => c !== ""),
      en: {
        Title: titleInputEN.value.trim(),
        Description: descriptionInputEN.value.trim()
      }
    }

    if (newPicture.Title === ""
        || newPicture.Description === ""
        || newPicture.en.Title === ""
        || newPicture.en.Description === ""
        || newPicture.Categories.length < 1
        || (fileInput.files.length !== 1 && currentPicture === -1)) {
      return
    }

    const pictureFormFieldset = document.getElementById("pictureFormFieldset")
    pictureFormFieldset.disabled = true

    const promise = (fileInput.files.length === 1) ?
      uploadToCloudinary(fileInput.files[0]).then ( imageUrl => {
      newPicture.CloudinaryImages = []
      newPicture.CloudinaryImages[0] = imageUrl
      return newPicture
    })  : Promise.resolve(newPicture)

    promise.then (pictureWithImage => {
      if (currentPicture === -1) {
        pictures.list.push(pictureWithImage)
        currentPicture = pictures.list.length - 1
        pictureIdInput.value = pictureWithImage.Page
      } else {
        pictureWithImage = Object.assign(pictures.list[currentPicture], pictureWithImage)
      }
      return generateFiles([pictureWithImage])
    }).then ( files => {
      return storage.updateFiles(pictures.treeSha, files)
    }).then( result => {
      result.object.sha
      showCurrentPicture()
    }).catch(error => handleError(error))
  }

  function errorClick() {
    init()
  }

  function fileChanged() {
    document.getElementById("previewImage").src = ""
  }

  function updateAllClick() {
    const pictureFormFieldset = document.getElementById("pictureFormFieldset")
    pictureFormFieldset.disabled = true

    storage.getTemplatePage()
        .then(template => {
          return languages.map(language => generateMainPage(template, language))
        }).then ( mainPageFiles => {
          return generateFiles(pictures.list).then(pictureFiles => {
              const allFiles = mainPageFiles.concat(pictureFiles)
              return storage.updateFiles(pictures.treeSha, allFiles)
            })
        }).then(_ => {
          showCurrentPicture()
        }).catch(error => handleError(error))
  }
  return {
    init: init,
    submitTokensForm: submitTokensForm,
    logoutClick: logoutClick,
    newPictureClick: newPictureClick,
    submitPictureForm: submitPictureForm,
    errorClick: errorClick,
    nextPictureClick: nextPictureClick,
    fileChanged: fileChanged,
    updateAllClick: updateAllClick
  }
})();