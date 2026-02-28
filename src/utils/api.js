import axios from 'axios';

class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  setBaseURL(url) {
    this.baseURL = url;
  }

  getFullURL(path) {
    return `${this.baseURL}${path}`;
  }

  // Grammar endpoints
  async uploadGrammar(content) {
    const response = await axios.put(
      this.getFullURL('/api/grammars/upload'),
      content,
      { headers: { 'Content-Type': 'text/plain' } }
    );
    return response.data;
  }

  async overwriteGrammar(name, content) {
    const response = await axios.put(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/upload/`),
      content,
      { headers: { 'Content-Type': 'text/plain' } }
    );
    return response.data;
  }

  async compileGrammar(name) {
    const response = await axios.get(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/compile/`)
    );
    return response.data;
  }

  async listGrammars() {
    const response = await axios.get(this.getFullURL('/api/grammars/list'));
    return response.data.split('\n').filter(line => line.trim());
  }

  async grammarExists(name) {
    const response = await axios.get(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/exists/`)
    );
    return response.data;
  }

  async grammarCompiled(name) {
    const response = await axios.get(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/compiled/`)
    );
    return response.data;
  }

  async getGrammar(name) {
    const response = await axios.get(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/get/`)
    );
    return response.data;
  }

  async deleteGrammar(name) {
    const response = await axios.delete(
      this.getFullURL(`/api/grammars/${encodeURIComponent(name)}/delete/`)
    );
    return response.data > 0;
  }

  // Parse endpoints
  async parse(name, startRule, input) {
    const response = await axios.put(
      this.getFullURL(`/api/parse/${encodeURIComponent(name)}/${encodeURIComponent(startRule)}`),
      input,
      { headers: { 'Content-Type': 'text/plain' } }
    );
    return response.data;
  }

  async getTreeLisp(name) {
    const response = await axios.get(
      this.getFullURL(`/api/parse/${encodeURIComponent(name)}/tree/lisp`)
    );
    return response.data;
  }

  async getTreeSvg(name) {
    const response = await axios.get(
      this.getFullURL(`/api/parse/${encodeURIComponent(name)}/tree/svg`)
    );
    return response.data;
  }

  async getErrors(name) {
    const response = await axios.get(
      this.getFullURL(`/api/parse/${encodeURIComponent(name)}/tree/errors`)
    );
    const errorText = response.data;
    if (!errorText || !errorText.trim()) return [];
    
    return errorText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/Line (\d+):(\d+)(.*)$/);
        if (match) {
          return {
            line: parseInt(match[1]),
            col: parseInt(match[2]),
            message: match[3].trim()
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  async getLastInput(name) {
    const response = await axios.get(
      this.getFullURL(`/api/parse/${encodeURIComponent(name)}/input`)
    );
    return response.data;
  }
}

export default new ApiService(window.location.origin);