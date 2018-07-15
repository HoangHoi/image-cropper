ImageCropper.replace('avatar');
for (var i = 0; i < 10000; i++) {
    var html = '<input type="file" id="avatar' + i + '" class="file-input" accept="image/x-png,image/jpeg"/>';
    document.getElementById('avatar').insertAdjacentHTML('beforebegin', html);
    ImageCropper.replace('avatar' + i);
}
