@component
export class EdgeFunctionCall extends BaseScriptComponent {
  @input internetModule: InternetModule;
  @input endpointUrl: string;
  @input publicKey: string;
  @input inputName: string;

  onAwake() {
    this.init();
  }

  init() {
    let request = RemoteServiceHttpRequest.create();
    request.url = this.endpointUrl;
    request.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.publicKey}`,
      apikey: this.publicKey,
    };
    request.method = RemoteServiceHttpRequest.HttpRequestMethod.Post;
    request.body = `{"name":"${this.inputName}"}`;
    
    this.internetModule.performHttpRequest(request, (response) => {
      print(response.statusCode + " " + response.body);
    });
  }
}