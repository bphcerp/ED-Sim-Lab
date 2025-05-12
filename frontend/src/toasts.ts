import { Bounce, toast, ToastOptions } from "react-toastify";

const config : ToastOptions = {
    position: "top-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: false,
    progress: undefined,
    theme: "colored",
    transition: Bounce,
}

export const toastError = (message : string) => {
    toast.error(message, config);
}

export const toastSuccess = (message : string) => {
    toast.success(message, config);
}
export const toastWarn = (message : string) => {
    toast.warn(message, config);
}