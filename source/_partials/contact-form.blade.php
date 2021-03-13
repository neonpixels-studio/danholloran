<form action="https://api.form-data.com/f/15spopzpzbrjo0qdy5cje8k" method="post">
    <div class="flex flex-wrap mb-6 -mx-3">
        <div class="w-full px-3 mb-6 md:w-1/2 md:mb-0">
            <label class="block mb-2 text-sm font-semibold" for="contact-name">
                Name
            </label>

            <input type="text" id="contact-name" placeholder="Jane Doe" name="name"
                class="block w-full px-4 py-3 mb-2 text-gray-800 border rounded-lg shadow outline-none" required>
        </div>

        <div class="w-full px-3 md:w-1/2">
            <label class="block mb-2 text-sm font-semibold" for="contact-email">
                Email Address
            </label>

            <input type="email" id="contact-email" placeholder="email@domain.com" name="email"
                class="block w-full px-4 py-3 mb-2 text-gray-800 border rounded-lg shadow outline-none" required>
        </div>
    </div>

    <div class="w-full mb-12">
        <label class="block mb-2 text-sm font-semibold" for="contact-message">
            Message
        </label>

        <textarea id="contact-message" rows="4" name="message"
            class="block w-full px-4 py-3 mb-2 text-gray-800 border rounded-lg shadow outline-none appearance-none"
            placeholder="A lovely message here." required></textarea>
    </div>

    <input type="text" name="xx_password" style="display:none !important" tabindex="-1" autocomplete="off">


    <div class="flex items-center justify-between w-full">
        <div class="g-recaptcha" data-sitekey="6Lel4Z4UAAAAAOa8LO1Q9mqKRUiMYl_00o5mXJrR"></div>
        <div>
            <button type="submit" class="button button-primary-inverted">Submit</button>
        </div>
    </div>
</form>
