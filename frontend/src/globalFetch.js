import {toastError, toastWarn} from "./toasts"

const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  options.credentials = options.credentials || 'same-origin';
  const isLoginPageRequest = options.headers ? options.headers['From-Page'] === 'login' : null

  const response = await originalFetch(url, options);

  // If the response is 440, it means the session has expired
  // Redirect to login page
  // Don't redirect to login page if the request is already a login page
  // This is to prevent infinite redirect loop
  if (!isLoginPageRequest && response.status === 440 ) {
    toastWarn("Session Expired. Redirecting...")
    window.location.href = '/login';
    return;
  }

  else if (response.status === 500){
    toastError((await response.json()).message || "Something went wrong")
    console.error((await response.json()).message || "Something went wrong")
    return
  }

  else return response
};