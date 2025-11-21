import { createClient, type NormalizeOAS } from 'fets'
import openapi from '../openapi'
import { makeid } from './genID'
import { getSpotifyAuthComplete, getSpotifyAuthRefresh, getSpotifyAuthState, getSpotifyAuthValue, setSpotifyAuthComplete, setSpotifyAuthRefresh } from '../savestate';

class spotifyTokenApiResponse {
    access_token!: string;
    token_type!: string;
    scope!: string;
    expires_in!: number;
    refresh_token!: string;
}

export class spotifyMonitor {
    readonly authorizerClient: any;
    authorization: string;
    readonly client: any;
    readonly clientID: string;
    readonly clientSecret: string;
    readonly clientRedirectURI: string;
    
    constructor() {
        this.authorization = "Unauthorized";
        this.authorizerClient = createClient<NormalizeOAS<typeof openapi>>({
            endpoint: 'https://accounts.spotify.com',
        });
        this.client = createClient<NormalizeOAS<typeof openapi>>({
            endpoint: 'https://api.spotify.com/v1'
        });
        this.clientID = import.meta.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
        this.clientRedirectURI = import.meta.env.SPOTIFY_REDIRECT_URI
    }
    
    async SpotifyAuth() {
        if (getSpotifyAuthState() && !getSpotifyAuthComplete()){ // refresh token not needed yet!
            const c = await this.authorizerClient['/api/token'].post({
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${this.clientID}:${this.clientSecret}`,'binary').toString("base64")}`,
                    'content-type': 'application/x-www-form-urlencoded',},
                    body: new URLSearchParams({
                        code: getSpotifyAuthValue(),
                        redirect_uri: this.clientRedirectURI,
                        grant_type: "authorization_code"
                    }).toString()
                })
                console.log(await c.json())
                var r = new spotifyTokenApiResponse();
                Object.assign(r, await c.json());
                this.authorization = r.access_token;
                setSpotifyAuthRefresh(r.refresh_token);
                console.log(`Wrote ${r.refresh_token}`)
                setSpotifyAuthComplete(true);
            }
            else if (getSpotifyAuthComplete() && getSpotifyAuthState()) // refresh token needed!
            {
                console.log(`Refreshing using ${getSpotifyAuthRefresh()}`)
                const c = await this.authorizerClient['/api/token'].post({
                    headers: {
                        "Authorization": `Basic ${Buffer.from(`${this.clientID}:${this.clientSecret}`,'binary').toString("base64")}`,
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        refresh_token: getSpotifyAuthRefresh(),
                        grant_type: "refresh_token"
                    }).toString()
                })
                console.log(await c.json())
                var r = new spotifyTokenApiResponse();
                Object.assign(r, await c.json());
                this.authorization = r.access_token;
                if (r.refresh_token)
                    { setSpotifyAuthRefresh(r.refresh_token); }
            }
            console.log(this.authorization);
        }   
        async SpotifyGetPlayingStatus(returnResponse: boolean){
            const apiResponse = await this.client['/me/player'].get({
                headers: {"Authorization": `Bearer ${this.authorization}`}
            })
            if (returnResponse) {return (await apiResponse)}
        }
    }
    