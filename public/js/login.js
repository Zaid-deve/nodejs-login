$(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault(); // Prevent normal form submission

        $('.formerr').removeClass('d-flex').addClass('d-none');
        $('.formerr span').text('');

        // Disable the submit button and change text
        $('#submitBtn').prop('disabled', true).text('Processing...');

        // Clear previous error messages
        $('#emailErr').text('');
        $('#passwordErr').text('');

        const formData = $(this).serialize(); // Serialize the form data for sending

        $.post('/auth/login', formData, function (response) {
            if (response.success) {
                return window.location.replace('/dashboard'); // Redirect after successful login
            }

            // Show validation errors
            if (response?.emailErr) {
                $('#emailErr').text(response?.emailErr);
            }

            if (response?.passErr) {
                $('#passwordErr').text(response.passErr);
            }

            if (response?.formErr) {
                $('.formerr').removeClass('d-none').addClass('d-flex');
                $('.formerr span').text(response.formErr);
            }
        }).fail(function (xhr, status, error) {
            $('.formerr').removeClass('d-none').addClass('d-flex');
            $('.formerr span').text('Something went wrong');
        }).always(function () {
            $('#submitBtn').prop('disabled', false).text('Login');
        });
    });
});
