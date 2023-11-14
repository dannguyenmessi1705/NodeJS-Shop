(function(){
    function readURL(input) {

        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar-img').css({
                    'background-size':'cover',
                    'background-position': '50% 50%'
                });
                $('.avatar-img').attr('src', e.target.result);
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    $("input.form-control[name=image]").change(function(){
        readURL(this);
    });
})()