$(function () {
    $('#signupForm').on('submit', function (e) {
        e.preventDefault(); // Prevent normal form submission

        $('.formerr').removeClass('d-flex').addClass('d-none')
        $('.formerr span').text('');

        // Disable the submit button and change text
        $('#submitBtn').prop('disabled', true).text('Processing...');

        // Clear previous error messages
        $('#usernameErr').text('');
        $('#emailErr').text('');
        $('#passwordErr').text('');

        const formData = $(this).serialize(); // Serialize the form data for sending

        $.post('/auth/signup', formData, function (response) {
            if (response.success) {
                return window.location.replace('/login');
            }

            // Show validation errors
            if (response?.usernameErr) {
                $('#usernameErr').text(response?.usernameErr);
            }

            if (response?.emailErr) {
                $('#emailErr').text(response.emailErr);
            }

            if (response?.passErr) {
                $('#passwordErr').text(response.passErr);
            }

            if (response?.formErr) {
                $('.formerr').removeClass('d-none').addClass('d-flex')
                $('.formerr span').text(response.formErr);
            }
        }).fail(function (xhr, status, error) {
            $('.formerr').removeClass('d-none').addClass('d-flex')
            $('.formerr span').text('Something went wrong');
        }).always(function () {
            $('#submitBtn').prop('disabled', false).text('Register');
        });
    });
});
