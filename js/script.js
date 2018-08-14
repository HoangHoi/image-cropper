ImageCropper.replace('avatar');
// for (var i = 0; i < 10; i++) {
//     var html = '<input type="file" id="avatar' + i + '" class="file-input" accept="image/x-png,image/jpeg"/>';
//     document.getElementById('avatar').insertAdjacentHTML('beforebegin', html);
//     ImageCropper.replace('avatar' + i);
// }
document.getElementById('crop').addEventListener('click', function (event) {
    // console.log(ImageCropper.instances.avatar);
    ImageCropper.handleCropImage(ImageCropper.instances.avatar);
    event.preventDefault();
});
