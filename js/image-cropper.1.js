const zoom = {
    'max': 5,
    'min': 1,
    'step': 1
};
const imageBoxWidthDefault = 200;
const imageBoxHeightDefalt = 200;

function getEmptyImageProperties() {
    return {
        width: 0,
        height: 0,
        size: 0
    };
}

function getEmptyPosition(imageBoxWidth, imageBoxHeight) {
    return {
        'x': 0,
        'y': 0,
        'minWidth': 1,
        'size': {
            'ratio': 1,
            'width': imageBoxWidth,
            'height': imageBoxHeight
        }
    };
}

function handleImageZoomChange(imageId, imagePosition, avatarNewWidth, imageBoxWidth, imageBoxHeight) {
    var element = document.getElementById(imageId);
    var avatarNewHeight = avatarNewWidth / imagePosition.size.ratio;
    imagePosition.x = -((-imagePosition.x + imageBoxWidth/2) * (avatarNewWidth / imagePosition.size.width) - imageBoxWidth/2);
    imagePosition.y = -((-imagePosition.y + imageBoxHeight/2) * (avatarNewHeight / imagePosition.size.height) - imageBoxHeight/2);
    imagePosition.size.width = avatarNewWidth;
    imagePosition.size.height = avatarNewHeight;
    imagePosition = this.fixPosition(imagePosition, imageBoxWidth, imageBoxHeight);
    setImageSize(imageId, imagePosition.size);
    updateImagePosition(element, imagePosition);
}

function fixPosition(imagePosition, imageBoxWidth, imageBoxHeight) {
    if (imagePosition.x > 0) {
        imagePosition.x = 0;
    }
    if (imagePosition.x < (imageBoxWidth - imagePosition.size.width)) {
        imagePosition.x = (imageBoxWidth - imagePosition.size.width);
    }
    if (imagePosition.y > 0) {
        imagePosition.y = 0;
    }
    if (imagePosition.y < (imageBoxHeight - imagePosition.size.height)) {
        imagePosition.y = (imageBoxHeight - imagePosition.size.height);
    }
    return imagePosition;
}

function updateImagePosition(element, position) {
    var imagePropertiesId = element.id.replace(new RegExp('image$'), 'properties');
    setImageProperties(imagePropertiesId, JSON.stringify(position));
    element.style.backgroundPositionX = (position.x) + 'px';
    element.style.backgroundPositionY = (position.y) + 'px';
}

function initResizeImageEvents(imageKeyId, imageBoxWidth = imageBoxWidthDefault, imageBoxHeight = imageBoxHeightDefalt) {
    var imagePropertiesId = imageKeyId + '-properties';
    var imageId = imageKeyId + '-image';
    var inputId = imageKeyId + '-input';
    var sliderId = imageKeyId + '-slider';
    var imagePosition = getEmptyPosition(imageBoxWidth, imageBoxHeight);
    var imageProperties = getEmptyImageProperties();
    var removeImageEventListener = null;

    $('#' + inputId).on('change', function (event) {
        var file = event.target.files[0];
        if (file) {
            onAvatarChange(file, imageId, sliderId, imagePosition, imageProperties, imageBoxWidth, imageBoxHeight);
            if (!removeImageEventListener) {
                addImageEventListener(imagePosition, imageId, imageBoxWidth, imageBoxHeight, function(removeEvents) {
                    removeImageEventListener = removeEvents;
                    $('#' + sliderId).show();
                });
            }
        } else {
            if (typeof removeImageEventListener == 'function') {
                $('#' + sliderId).hide();
                removeImageEventListener();
                removeImageEventListener = undefined;
            }
        }
    });

    $('#' + sliderId).slider({
        min: zoom.min * imagePosition.minWidth,
        max: zoom.max * imagePosition.minWidth,
        step: zoom.step,
        change: function (event, ui) {
            handleImageZoomChange(imageId, imagePosition, ui.value, imageBoxWidth, imageBoxHeight);
        }
    });
}

function setImageSize(imageId, size) {
    var element = document.getElementById(imageId);
    if (element && element.tagName == 'DIV') {
        element.style.backgroundSize = size.width + 'px ' + size.height + 'px';
    }
}

function setImageBackground(imageId, data) {
    var element = document.getElementById(imageId);
    if (element && element.tagName == 'DIV') {
        element.style.backgroundImage = "url('" + data + "')";
    } else {
        console.log('Image Properties not set');
    }
}

function setImageProperties(imagePropertiesId, data) {
    var element = document.getElementById(imagePropertiesId);
    if (element && element.tagName == 'INPUT') {
        element.value = data;
    } else {
        console.log('Image Properties not set');
    }
}

function addImageEventListener(imagePosition, imageId, imageBoxWidth, imageBoxHeight, calback) {
    var flag = false;
    var element = document.getElementById(imageId);
    var positionX = 0;
    var positionY = 0;
    var clientX = 0;
    var clientY = 0;
    var handleMouseDownEvent = function(event) {
        flag = true;
        clientX = event.clientX;
        clientY = event.clientY;
        positionX = element.style.backgroundPositionX;
        positionY = element.style.backgroundPositionY;
        event.preventDefault();
    };

    var handleMouseUpEvent = function(event) {
        flag = false;
        // clientX = 0;
        // clientY = 0;
        event.preventDefault();
    };

    var handleMouseOutEvent = function(event) {
        flag = false;
        // clientX = 0;
        // clientY = 0;
        event.preventDefault();
    };

    var handleMouseMoveEvent = function(event) {
        if(flag){
            var dentaPositionX = event.clientX - clientX;
            var dentaPositionY = event.clientY - clientY;

            var x = parseFloat(positionX) + dentaPositionX;
            var y = parseFloat(positionY) + dentaPositionY;

            if (typeof x === 'number' && x <= 0 && x >= (imageBoxWidth - imagePosition.size.width)) {
                imagePosition.x = x;
            }
            if (typeof y === 'number' && y <= 0 && y >= (imageBoxHeight - imagePosition.size.height)) {
                imagePosition.y = y;
            }

            updateImagePosition(element, imagePosition);
        }

        event.preventDefault();
    };

    // function addResizeImageEvents() {
    element.addEventListener('mousedown', handleMouseDownEvent, false);
    element.addEventListener('mouseup', handleMouseUpEvent, false);
    element.addEventListener('mouseout', handleMouseOutEvent, false);
    element.addEventListener('mousemove', handleMouseMoveEvent, false);
    // };

    if (typeof calback == 'function') {
        calback(function () {
            element.removeEventListener('mousedown', handleMouseDownEvent, false);
            element.removeEventListener('mouseup', handleMouseUpEvent, false);
            element.removeEventListener('mouseout', handleMouseOutEvent, false);
            element.removeEventListener('mousemove', handleMouseMoveEvent, false);
            setImageBackground(imageId, '');
        });
    }

    // var {imagePosition} = this.state;
    // if (this.avatarSlider && imagePosition.size) {
    //     this.avatarSlider.setState({value: imagePosition.size.width});
    // }
}

function onAvatarChange(file, imageId, sliderId, imagePosition, imageProperties, imageBoxWidth, imageBoxHeight) {
    getOrientation(file, (function (orientation) {
        changeImage(file, orientation, imageId, sliderId, imagePosition, imageProperties, imageBoxWidth, imageBoxHeight);
    }));
}

function changeAvatarToDefault() {
    // this.setState({
    //     avatarData: null,
    //     avatar: null,
    //     avatarProperties: getEmptyAvatarProperties(),
    //     imagePosition: getEmptyPosition()
    // });
    // this.avatarSlider.setState({value: 1});
    // this.removeAvatarEvents();
}

function changeImage(file, orientation, imageId, sliderId, imagePosition, imageProperties, imageBoxWidth, imageBoxHeight) {
    var img;
    img = new Image();
    img.onload = function() {
        var width = img.width,
            height = img.height,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        if (4 < orientation && orientation < 9) {
            canvas.width = height;
            canvas.height = width;
        } else {
            canvas.width = width;
            canvas.height = height;
        }

        switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height , width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
            default: break;
        }

        ctx.drawImage(img, 0, 0);

        var imagePositionSize = {
            'ratio': canvas.width / canvas.height,
            'width': 0,
            'height': 0
        };
        if (canvas.width / canvas.height > imageBoxWidth / imageBoxHeight) {
            imagePositionSize.height = imageBoxHeight;
            imagePositionSize.width = imageBoxHeight * imagePositionSize.ratio;
        } else {
            imagePositionSize.width = imageBoxWidth;
            imagePositionSize.height = imageBoxWidth / imagePositionSize.ratio;
        }

        imageProperties.width = img.width;
        imageProperties.height = img.width;
        imageProperties.size = file.size;

        imagePosition.x = 0;
        imagePosition.y = 0;
        imagePosition.minWidth = imagePositionSize.width;
        imagePosition.size = imagePositionSize;

        var element = document.getElementById(imageId);
        setImageBackground(imageId, canvas.toDataURL());
        $('#' + sliderId).slider('option', 'min', zoom.min * imagePosition.minWidth);
        $('#' + sliderId).slider('option', 'max', zoom.max * imagePosition.minWidth);
        $('#' + sliderId).slider('value', zoom.min * imagePosition.minWidth);
        updateImagePosition(element, imagePosition);
    };
    img.src = URL.createObjectURL(file);
}

function getOrientation(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var view = new DataView(e.target.result);
        if (view.getUint16(0, false) != 0xFFD8) {
            return callback(-2);
        }
        var length = view.byteLength, offset = 2;
        while (offset < length) {
            var marker = view.getUint16(offset, false);
            offset += 2;
            if (marker == 0xFFE1) {
                if (view.getUint32(offset += 2, false) != 0x45786966) {
                    return callback(-1);
                }
                var little = view.getUint16(offset += 6, false) == 0x4949;
                offset += view.getUint32(offset + 4, little);
                var tags = view.getUint16(offset, little);
                offset += 2;
                for (var i = 0; i < tags; i++) {
                    if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                        return callback(view.getUint16(offset + (i * 12) + 8, little));
                    }
                }
            }
            else if ((marker & 0xFF00) != 0xFF00) break;
            else offset += view.getUint16(offset, false);
        }
        return callback(-1);
    };
    reader.readAsArrayBuffer(file);
}
