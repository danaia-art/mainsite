'use strict';

const adminApp = (function(){

  const cloud = 'danaia-art'
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`
  const cloudinaryPrefix = `https://res.cloudinary.com/${cloud}/image/upload`
  let repoToken = null
  let cloudinaryToken = null
  let pictures = null

  function init() {
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
    }
    document.getElementById("errorForm").style.display = "none"
  }

  function submitTokensForm() {
    const repoTokenInput = document.getElementById("repoTokenInput")
    const newRepoToken = repoTokenInput.value.trim()
    const cloudinaryTokenInput =document.getElementById("cloudinaryTokenInput")
    const newCloudinaryToken = cloudinaryTokenInput.value.trim()
    if (newRepoToken === "") {
      return
    }
    if (newCloudinaryToken === "") {
      return
    }
    document.getElementById("tokensForm").style.display = "none"
    document.getElementById("topPanel").style.display = "block"
    repoTokenInput.value = ""
    cloudinaryTokenInput.value = ""
    localStorage.setItem("repoToken", newRepoToken)
    repoToken = newRepoToken
    localStorage.setItem("cloudinaryToken", newCloudinaryToken)
    cloudinaryToken = newCloudinaryToken
    initPicturesList()
  }

  function initPicturesList() {
    storage.init(repoToken)
    storage.getPictureList()
        .then(picturesList => pictures = picturesList)
        .then(_ => console.log(pictures))
        .catch(error => handleError(error))
  }

  function logoutClick() {
    localStorage.removeItem("repoToken")
    repoToken = null
    localStorage.removeItem("cloudinaryToken")
    cloudinaryToken = null
    init()
  }

  function newPictureClick() {
    document.getElementById("titleInput").value = ""
    document.getElementById("titleInputEN").value = ""
    document.getElementById("descriptionInput").value = ""
    document.getElementById("descriptionInputEN").value = ""
    document.getElementById("fileInput").value = ""
    document.getElementById("pictureFormFieldset").disabled = false
    document.getElementById("pictureForm").style.display = "block"
  }

  function submitPictureForm() {

    const titleInput = document.getElementById("titleInput")
    const titleInputEN = document.getElementById("titleInputEN")
    const descriptionInput = document.getElementById("descriptionInput")
    const descriptionInputEN = document.getElementById("descriptionInputEN")
    const categoriesInput = document.getElementById("categoriesInput")
    const fileInput = document.getElementById("fileInput")

    const newPicture = {
      Title: titleInput.value.trim(),
      Description: descriptionInput.value.trim(),
      Categories: categoriesInput.value.split(", ")
          .map(c => c.trim())
          .filter(c => c !== ""),
      en: {
        Title: titleInputEN.value.trim(),
        Description: descriptionInputEN.value.trim()
      },
      CloudinaryImages: []
    }

    if (newPicture.Title === ""
        || newPicture.Description === ""
        || newPicture.en.Title === ""
        || newPicture.en.Description === ""
        || newPicture.Categories.length < 1
        || fileInput.files.length !== 1 ) {
      return
    }

    const pictureFormFieldset = document.getElementById("pictureFormFieldset")
    pictureFormFieldset.disabled = true
    uploadToCloudinary(fileInput.files[0]).then ( imageUrl => {
      newPicture.CloudinaryImages[0] = imageUrl
      return newPicture
    }).then (pictureWithImage => console.log(pictureWithImage))
    .then( args => {
      document.getElementById("pictureForm").style.display = "none"
      pictureFormFieldset.disabled = false
    })
    .catch(error => handleError(error))
  }

  function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", cloudinaryToken)
    return fetch(cloudinaryUrl, { method: "POST", body: formData})
        .then (response => response.json())
        .then (result => result.secure_url.slice(cloudinaryPrefix.length))
  }

  function handleError(error) {
    console.error(error)
    document.getElementById("errorCaption").innerText = `Error ${error.message}`
    document.getElementById("errorText").innerText = error.stack
    document.getElementById("errorForm").style.display = "block"
  }

  function errorClick() {
    init()
  }

  return {
    init: init,
    submitTokensForm: submitTokensForm,
    logoutClick: logoutClick,
    newPictureClick: newPictureClick,
    submitPictureForm: submitPictureForm,
    errorClick: errorClick
  }
})();