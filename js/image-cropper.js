window.ImageCropper = (function () {
    const DEFAULT_OPTIONS = {
        width: 200,
        height: 200,
        zoomMax: 5,
        zoomStep: 0.1
    };
    const IC_PREFIX = 'ic-';
    const IC_VIEW_PREFIX = 'ic-view-';
    const WHEEL_STEP = 53;

    const TEMPLATE = '<div class="image-cropper-container" id="@%icId%@">' +
        '<div class="image-view" id="@%icViewId%@" style="width: @%width%@px;height: @%height%@px;"></div>' +
        '<label for="@%inputId%@" class="file-label">' +
        'Chọn ảnh' +
        '</label>' +
        '</div>';

    var instances = {};

    function drawTemplate(instance) {
        var inputElement = document.getElementById(instance.inputId);
        var html = TEMPLATE.replace(/@%inputId%@/g, instance.inputId)
            .replace(/@%icId%@/g, IC_PREFIX + instance.inputId)
            .replace(/@%icViewId%@/g, IC_VIEW_PREFIX + instance.inputId)
            .replace(/@%width%@/g, instance.options.width)
            .replace(/@%height%@/g, instance.options.height);
        inputElement.insertAdjacentHTML('beforebegin', html);
        inputElement.style.display = 'none';
    }

    function replaceOptions(options = {}) {
        return Object.assign({}, DEFAULT_OPTIONS, options);
    }

    function addEvents(instance) {
        addImageChangeEvents(instance);
        addMouseEventsToInstance(instance);

        // console.log(inputElement.closest('form'));
    }

    function addMouseEventsToInstance(instance) {
        var element = document.getElementById(IC_VIEW_PREFIX + instance.inputId);
        var handleMouseMoveEvent = function(event) {
            if (event.buttons == 1) {
                var positionX = element.style.backgroundPositionX;
                var positionY = element.style.backgroundPositionY;
                var x = parseFloat(positionX) + event.movementX;
                var y = parseFloat(positionY) + event.movementY;

                var imageBoxWidth = instance.options.width;
                var imageBoxHeight = instance.options.height;

                if (typeof x === 'number' && x <= 0 && x >= (imageBoxWidth - instance.imageOptions.position.width)) {
                    instance.imageOptions.position.x = x;
                }

                if (typeof y === 'number' && y <= 0 && y >= (imageBoxHeight - instance.imageOptions.position.height)) {
                    instance.imageOptions.position.y = y;
                }

                updateImagePosition(element, instance.imageOptions.position);
            }

            event.preventDefault();
        };

        var handleMouseScrollWheel = function(event) {
            if (event.ctrlKey) {
                var zoomDelta = (event.deltaY * instance.options.zoomStep) / WHEEL_STEP;
                instance.imageOptions.position.zoom = instance.imageOptions.position.zoom - zoomDelta;
                if (instance.imageOptions.position.zoom < instance.imageOptions.zoomMin) {
                    instance.imageOptions.position.zoom = instance.imageOptions.zoomMin;
                }
                if (instance.imageOptions.position.zoom > instance.imageOptions.zoomMax) {
                    instance.imageOptions.position.zoom = instance.imageOptions.zoomMax;
                }

                var newWidth = instance.imageOptions.originWidth * instance.imageOptions.position.zoom;
                var newHeight = instance.imageOptions.originHeight * instance.imageOptions.position.zoom;
                var boxWidth = instance.options.width;
                var boxHeight = instance.options.height;

                instance.imageOptions.position.x = -((-instance.imageOptions.position.x + boxWidth/2) * (newWidth / instance.imageOptions.position.width) - boxHeight/2);
                instance.imageOptions.position.y = -((-instance.imageOptions.position.y + boxHeight/2) * (newHeight / instance.imageOptions.position.height) - boxHeight/2);
                instance.imageOptions.position.width = newWidth;
                instance.imageOptions.position.height = newHeight;

                if (instance.imageOptions.position.x > 0) {
                    instance.imageOptions.position.x = 0;
                }
                if (instance.imageOptions.position.x < (instance.options.width - instance.imageOptions.position.width)) {
                    instance.imageOptions.position.x = (instance.options.width - instance.imageOptions.position.width);
                }
                if (instance.imageOptions.position.y > 0) {
                    instance.imageOptions.position.y = 0;
                }
                if (instance.imageOptions.position.y < (instance.options.height - instance.imageOptions.position.height)) {
                    instance.imageOptions.position.y = (instance.options.height - instance.imageOptions.position.height);
                }

                updateImagePosition(element, instance.imageOptions.position);
                updateImageSize(element, instance.imageOptions.position);
                event.preventDefault();
            }
        };

        instance.addResizeImageEvents = function () {
            element.addEventListener('mousemove', handleMouseMoveEvent, true);
            element.addEventListener('wheel', handleMouseScrollWheel, true);
        };

        instance.removeResizeImageEvents = function () {
            element.removeEventListener('mousemove', handleMouseMoveEvent, true);
            element.removeEventListener('wheel', handleMouseScrollWheel, true);
        };
    }

    function updateImagePosition(element, imagePosition) {
        element.style.backgroundPositionX = imagePosition.x + 'px';
        element.style.backgroundPositionY = imagePosition.y + 'px';
    }

    function updateImageSize(element, imagePosition) {
        element.style.backgroundSize = imagePosition.width + 'px ' + imagePosition.height + 'px';
    }

    function addImageChangeEvents(instance) {
        var inputElement = document.getElementById(instance.inputId);
        var onChangeFile = function (event) {
            var files = event.target.files;
            if (files.length > 0) {
                instance.file = files[0];
                getOrientation(instance.file, function (orientation) {
                    instance.imageOptions.orientation = orientation;
                    changeImage(instance);
                });
            } else {
                instance.file = null;
                setImageToView(instance, '');
            }
        };
        instance.events.push({
            elementId: instance.inputId,
            name: 'change',
            func: onChangeFile
        });
    }

    function listenEvents(instance) {
        instance.events.forEach(function (event) {
            var element = document.getElementById(event.elementId);
            if (!element) {
                console.log('Element #' + event.elementId + ' not found');
                return;
            }
            element.addEventListener(event.name, event.func);
        });
    }

    function removeEventsListener(instance) {
        instance.events.forEach(function (event) {
            var element = document.getElementById(event.elementId);
            if (!element) {
                console.log('Element #' + event.elementId + ' not found');
                return;
            }
            element.removeEventListener(event.name, event.func);
        });
    }

    function changeImage(instance) {
        var img;
        img = new Image();
        img.onload = function() {
            var width = img.width,
                height = img.height,
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            if (4 < instance.imageOptions.orientation && instance.imageOptions.orientation < 9) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }

            switch (instance.imageOptions.orientation) {
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

            instance.imageOptions.originWidth = width;
            instance.imageOptions.originHeight = height;

            var viewWidth = instance.options.width;
            var viewHeight = instance.options.height;

            if (width/height > viewWidth/viewHeight) {
                instance.imageOptions.position.height = viewHeight;
                instance.imageOptions.position.width = (viewHeight * width) / height;
            } else {
                instance.imageOptions.position.width = viewWidth;
                instance.imageOptions.position.height = (viewWidth * height) / width;
            }

            instance.imageOptions.position.x = 0;
            instance.imageOptions.position.y = 0;
            instance.imageOptions.zoomMin = instance.imageOptions.position.width / width;
            instance.imageOptions.position.zoom = instance.imageOptions.zoomMin;

            setImageToView(instance, canvas.toDataURL());
        };

        img.src = URL.createObjectURL(instance.file);
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

    function setImageToView(instance, data) {
        var element = document.getElementById(IC_VIEW_PREFIX + instance.inputId);
        if (element && element.tagName == 'DIV') {
            if (data) {
                element.style.backgroundImage = "url('" + data + "')";
                updateImagePosition(element, instance.imageOptions.position);
                updateImageSize(element, instance.imageOptions.position);
                instance.addResizeImageEvents();
                return;
            }

            element.style.backgroundImage = '';
            instance.removeResizeImageEvents();
            return;
        }

        console.log('Image view not set');
    }

    function destroy(instanceName) {
        if (instances[instanceName]) {
            instance.desFuncs.forEach(function (func) {
                if (typeof func == 'function') {
                    func();
                }
            });

            delete instances[instanceName];
        }
    }

    function makeInstance(inputId, options) {
        return {
            inputId: inputId,
            options: replaceOptions(options),
            desFuncs: [],
            events: [],
            imageOptions: makeImageOptions(),
            file: null
        };
    }

    function getImageCroped() {

    }

    function handleCropImage(instance) {
        var img = new Image;
        var imgElement = document.getElementById(IC_VIEW_PREFIX + instance.inputId);
        var style = imgElement.currentStyle || window.getComputedStyle(imgElement, false);
        var bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");
        img.onload = function () {
            var cropCanvas = document.createElement('canvas');
            var ctx = cropCanvas.getContext('2d');
            cropCanvas.width = instance.options.width;
            cropCanvas.height = instance.options.height;
            ctx.drawImage(img, instance.imageOptions.position.x, instance.imageOptions.position.y, instance.imageOptions.position.width, instance.imageOptions.position.height);
            var dataURL = cropCanvas.toDataURL();
            var element = document.getElementById('output');
            element.style.backgroundImage = "url('" + dataURL + "')";
        };
        img.src = bi;
    }

    function makeImageOptions() {
        return {
            orientation: 1,
            originWidth: 0,
            originHeight: 0,
            zoomMin: 1,
            position: {
                x: 0,
                y: 0,
                zoom: 0,
                width: 0,
                height: 0
            }
        };
    }

    function replace(inputId, options) {
        if (instances[inputId]) {
            return instances[inputId];
        }

        var inputElement = document.getElementById(inputId);

        if (!inputElement) {
            console.log('Input element not found');
            return null;
        }

        var instance = makeInstance(inputId, options);

        drawTemplate(instance);
        addEvents(instance);
        listenEvents(instance);
        instances[inputId] = instance;

        return instance;
    }

    return {
        replace: replace,
        instances: instances,
        handleCropImage: handleCropImage
    };
}());
