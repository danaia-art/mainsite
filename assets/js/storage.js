//https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree
//https://www.freecodecamp.org/news/pushing-a-list-of-files-to-the-github-with-javascript-b724c8c09b66/

const storage = (function () {
  const repoPath = "danaia-art/mainsite"
  const picturesJson = "pictures.json"
  const indexHtmlTemplate = "___index.html"

  let repo = null

  function init(token) {
    const gitHub = new GitHub({ token: token})
    repo = gitHub.getRepo(repoPath)
  }

  function getPictureList() {
    return repo.getTree("main")
        .then(tree => {
          const picturesJsonFile = tree.data.tree.find(file => file.path === picturesJson)
          return repo.getBlob(picturesJsonFile.sha)
              .then(blob => {
                return { treeSha: tree.data.sha, list: blob.data}
              })
        })
  }

  function getTemplatePage() {
    return repo.getTree("main")
        .then(tree => {
          const picturesJsonFile = tree.data.tree.find(file => file.path === indexHtmlTemplate)
          return repo.getBlob(picturesJsonFile.sha)
              .then(blob => blob.data)
        })
  }


  function updateFiles(treeSha, list) {
    const promises = list.map(file =>
      repo.createBlob(file.content).then(response => {
        file.sha = response.data.sha
        return file
      })
    )
    Promise.all(promises)
        .then(files => {
          const treeItems = files.map(file => {
            return { path: file.path,
              mode: "100644",
                type: "blob",
                sha: file.sha
            }
          })
          return repo.createTree(
              treeItems,
              treeSha
          )
        }).then(tree => {
          return repo.getRef("heads/main").then (response => {
            return { treeSha: tree.data.sha, commitSha: response.data.object.sha }
          })
        }).then( newTreeAndPreviousCommit => {
          return repo.commit(
              newTreeAndPreviousCommit.commitSha,
              newTreeAndPreviousCommit.treeSha,
              "from admin"
          )
        }).then( response =>  {
          return repo.updateHead("heads/main",response.data.sha)
        }).then(response => {
           if (response.status !== 200) {
             console.error(response)
             throw Error(`Updatehead response status ${response.status}. See log for details.`)
           } else {
             console.info(response.data)
           }
        })
  }

  return {
    init: init,
    getPictureList: getPictureList,
    updateFiles: updateFiles,
    getTemplatePage: getTemplatePage,
    picturesJson: picturesJson
  }
}
)();
