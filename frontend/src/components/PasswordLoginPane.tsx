import { Button, Label, TextInput } from "flowbite-react";
import { FormEventHandler, FunctionComponent } from "react";

interface PasswordLoginPaneProps {
    onSubmit : FormEventHandler<HTMLFormElement>
}
 
const PasswordLoginPane: FunctionComponent<PasswordLoginPaneProps> = (props : PasswordLoginPaneProps) => {
    return (
        <form onSubmit={props.onSubmit}>
            <Label className="text-base" htmlFor="email">Email</Label>
            <TextInput className="mt-2 mb-6" id="email" name="email" required/>
            <Label className="text-base" htmlFor="pwd">Password</Label>
            <TextInput type="password" className="mt-2 mb-4" id="pwd" name="pwd" required />

            <div className="flex justify-center">
                <Button type="submit" className="w-28" color="blue">Sign In</Button>
            </div>
        </form>
    );
}
 
export default PasswordLoginPane;