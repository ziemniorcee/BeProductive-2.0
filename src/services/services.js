export class AppServices {
    constructor(app) {
        this.app = app
        this.login_token_name = 'jwt'
        this.token = this.get_token()
        this.host = 'http://localhost:8080'
        // this.host = 'https://todo-api-965384144322.europe-west1.run.app'
    }

    init() {

    }

    get_token(){
        let token = localStorage.getItem(this.login_token_name)
        console.log(token)
        return token
    }

    set_token(token){
        localStorage.setItem(this.login_token_name, token);
        this.token = token
    }

    async is_token_valid(){

        if (this.token === null || this.token === undefined || this.token === ""){
            return false
        }
        else {
            try{
                let server_response = await this.token_test()
                if (server_response.status === 200){
                    this.app.vignette.loginVignette.is_logged = true
                    return true
                }
                else {
                    if (server_response.status !== 401){
                        throw new Error(`Error ${server_response.status}: ${server_response.statusText}`);
                    }
                    return false
                }
            }
            catch(e){
                console.log("Wrong token")
                return false
            }
        }
    }

    async token_test(){
        const res = await fetch(`${this.host}/api/get-categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });
        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res
    }

    async login(data){
        try {
            const res = await fetch(`${this.host}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.status === 401) {
                output.textContent = '❌  Wrong e-mail or password.';
                return false;               // tell the caller “login failed”
            }

            if (!res.ok) {                // 4xx/5xx other than 401
                // You might want to read the body to show the API message:
                const msg = await res.text();
                throw new Error(`${res.status} – ${msg || res.statusText}`);
            }

            const json = await res.json();
            output.textContent = JSON.stringify(json, null, 2);

            if (json.success && json.token) {
                this.set_token(json.token)

                return true
            }
            return false
        } catch (err) {
            console.error(err);
            output.textContent = 'Something went wrong – try again later.';
            return false
        }
    }

    async data_getter(url, params){

        const params_url = new URLSearchParams(params);
        const res = await fetch(`${this.host}/api/${url}?${params_url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });
        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const { success, tasks, error } = await res.json();
        if (!success) throw new Error(error);

        return tasks;
    }

    async data_getter2(url, params){
        const params_url = new URLSearchParams(params);
        const res = await fetch(`${this.host}/api/${url}?${params_url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });
        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const { success, error, ...rest } = await res.json();
        const data = rest[Object.keys(rest)[0]]
        if (!success) throw new Error(error);
        return data;
    }

    async data_deleter(url, params){
        const params_url = new URLSearchParams(params);
        const res = await fetch(`${this.host}/api/${url}?${params_url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login, etc.
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const { success, error, ...rest } = await res.json();
        if (!success) throw new Error(error);

        // server for DELETE usually returns something like { deleted: 1 }
        return rest[Object.keys(rest)[0]];
    }

    async data_updater(url, params, type='PUT'){
        const params_url = new URLSearchParams(params);
        const res = await fetch(`${this.host}/api/${url}?${params_url}`, {
            method: type,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login, etc.
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const { success, error, ...rest } = await res.json();
        if (!success) throw new Error(error);

        // server for DELETE usually returns something like { deleted: 1 }
        return rest[Object.keys(rest)[0]];
    }

    async data_poster(url, params){
        const params_url = new URLSearchParams(params);
        const res = await fetch(`${this.host}/api/${url}?${params_url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                // token expired or invalid → redirect to login, etc.
            }
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const { success, error, ...rest } = await res.json();
        if (!success) throw new Error(error);

        // server for DELETE usually returns something like { deleted: 1 }
        return rest[Object.keys(rest)[0]];
    }
}