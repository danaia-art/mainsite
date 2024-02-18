//https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree
//https://www.freecodecamp.org/news/pushing-a-list-of-files-to-the-github-with-javascript-b724c8c09b66/

const storage = (function () {
  const repoPath = "danaia-art/mainsite"
  const picturesJson = "pictures.json"
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

  function updatePictureList(list) {
    const json = JSON.stringify(list.list, null, 4)
    return repo.createBlob(json)
        .then(response => {
          return repo.createTree(
              [ { "path": picturesJson, "mode": "100644", "type": "blob", "sha": response.data.sha} ],
              list.treeSha
          )
        }).then(tree => {
          return repo.getRef("heads/main").then (response => {
            return { treeSha: tree.data.sha, commitSha: response.data.object.sha }
          })
        }).then( newTreeAndPreviousCommit => {
          return repo.commit(
              newTreeAndPreviousCommit.treeSha,
              newTreeAndPreviousCommit.commitSha,
              "updatePictureList"
          )
        }).then( response => repo.updateHead("heads/main",response.data.sha)
         .then(response => {
           if (response.status !== 200) {
             console.error(response)
             throw Error(`Updatehead response status ${response.status}. See log for details.`)
           }
         })
    )
  }

  return {
    init: init,
    getPictureList: getPictureList,
    updatePictureList: updatePictureList
  }
}
)();
