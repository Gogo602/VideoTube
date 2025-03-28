class ApiResponse {
    constructor(statusCode, data, message = "success") {
        this.statusCode = this.statusCode
        this.date = data
        this.message = message 
        this.success = statusCode < 400
    }
  
}

export {ApiResponse}