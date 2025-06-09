export class LoginVignette {
    constructor(app) {
        this.app = app
        this.initEventListeners()
        this.templates = new LoginTemplates(app)
    }

    initEventListeners() {
        $(document).on('click', '.btn-primary', async (event) => {
            event.preventDefault();
            await this.try_login()
        })
    }

    display() {
        $('#vignette').css('display', 'block')
        $("#vignette").append(this.templates.render())
    }

    async try_login() {
        const data = Object.fromEntries(
            new FormData($('.login-form')[0]).entries()
        );
        try {
            const res = await fetch('https://todo-api-965384144322.europe-west1.run.app/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            output.textContent = JSON.stringify(json, null, 2);

            // if success, store token and show example of using it
            if (json.success && json.token) {
                localStorage.setItem('jwt', json.token);
                output.textContent += '\n\n✅ Token saved to localStorage.';
            }
        } catch (err) {
            console.log("CHUJ")
            output.textContent = '❌ Error:\n' + err;
        }
    }

}

class LoginTemplates {
    constructor(app) {
        this.app = app

    }

    render() {
        return `
            <div id="login" class="vignetteWindow3">
                <form class="login-form">
                    <div class="logo">
                        <h1>BeProductive</h1>
                    </div>
                    <h2>Sign In</h2>
                    <div class="input-group">
                        <label for="email">Email</label>
                        <input type="email" name="email" id="email" placeholder="you@example.com" value="bob@example.com" required />
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" name="password" id="password" placeholder="••••••••" value="Test1234!" required />
                    </div>
                    <button type="button" class="btn-primary">Log In</button>
                    <p class="helper-text">
                        <a href="#">Forgot password?</a> • <a href="#">Sign up</a>
                    </p>
                </form>
                <pre id="output">–</pre>
            </div>
            `
    }
}