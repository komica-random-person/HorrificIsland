/* global: getID, getQuery, getQueries, getQueriesArray, escape, findParent, $ */
const apiUrl = 'http://localhost:8888/';

$(() => {
  const postError = errorCode => {
  
  };
  const postArticle = evt => {
    const tags = getID('hashtags').value || null;
    const postData = {
      name: getID('postName').value || null,
      title: getID('postTitle').value || null,
      content: getID('postContent').value || null,
      imageurl: getID('imgurl').value || null,
      tags: tags === null ? null : tags.replace(/,\s*/g, ',').split(','),
      allowComment: getID('allowComment').value === 'on',
    };
    const data = new FormData();
    for(let k in postData)
      data.append(k, postData[k])
    const imgfile = getID('imgfile').files;
    if(imgfile.length > 0)
      data.append('imgfile', imgfile[0]);

    /* check if the post is OK */
    if(postData.content === null && postData.imgurl === null && imgfile.length === 0) {
      postError('NoContent');
    } else {
      postFormAPI('article', data, reponse => {
        console.log(response)
      });
    }
  };
  getID('submit').addEventListener('click', postArticle);

  const getHeader = () => {
    "X-user-id": $.cookie('keygen')
  };
  const postFormAPI = (func, data, callback) => {
    $.ajax({
      type: 'POST',
      url: apiUrl + func,
      data,
      contentType: false,
      processData: false,
      headers: getHeader(),
      success: (_data, textStatus, jqXHR) => {
        console.log(func);
        console.log(_data);
        console.log(jqXHR);
        callback(_data, textStatus, jqXHR);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
      },
    });
  };
  const postAPI = (func, data, callback) => {
    $.ajax({
      type: 'POST',
      url: apiUrl + func,
      data: JSON.stringify(data),
      contentType: 'application/json;',
      dataType: 'json',
      headers: getHeader(),
      success: (_data, textStatus, jqXHR) => {
        console.log(func);
        console.log(_data);
        callback(_data, textStatus, jqXHR);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
      },
    });
  };
  const getAPI = (func, callback) => {
    $.ajax({
      type: 'GET',
      dataType: 'json',
      headers: getHeader(),
      url: apiUrl + func,
      contentType: 'application/json;',
      success: (data, textStatus, jqXHR) => {
        callback(data, textStatus, jqXHR);
      },
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
      },
    });
  };
});




