//https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#create-a-tree

var repo = null
function test() {
  console.log("test")
  const gitHub = new GitHub({ token:"<TOKEN>"})
  repo = gitHub.getRepo("danaia-art/mainsite")
  repo.getTree("main").then( mainTree => {
    console.log(mainTree)
    console.log(mainTree.sha)
    const file = mainTree.data.tree.find(obj => obj.path == "index.html")
    console.log(file.sha)
    return file.sha
  }).then(templateSha => repo.getBlob(templateSha)
  ) .then(blob => {
    console.log(blob)
    return blob.data
  }).then (blobData => repo.createBlob(blobData))
  .then(newBlob => {
    return newBlob.data.sha
  }).then( fileSha =>

      repo.createTree([ { "path": "test.txt", "mode": "100644", "type": "blob", "sha": "BLOB_SHA"} ],
          /*base tree sha*/"d89907a7ec227e27f8ccbd3fb22fce6f2bb4de6d")

      //!!!or content instead of blob
  ).then( tree => {
    tree.data.sha //tree sha
    repo.getRef("heads/main")
    //then  data.object.sha //current commit sha
    //return tree.sha and commit.sha
  }).then(
  return repo.commit(/*tree.sha*/"d89907a7ec227e27f8ccbd3fb22fce6f2bb4de6d",/*new commit sha*/"f93f0f9017af6eea5ae5a9ed6d2acaae02c50fee", "test message")
).then( response => {
    return repo.updateHead("heads/main",response.data.sha)
  }).then(response => {
    if (response.status == 200) OK!!
  }).catch(ex => console.log(ex))
}