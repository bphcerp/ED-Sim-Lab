import { Label, Modal, Table, ToggleSwitch, Button } from "flowbite-react";
import { FunctionComponent, useState } from "react";
import { useForm } from "react-hook-form";
import { formatCurrency } from "../helper";

interface CarryConfirmationModalProps {
    projectHeads: { [key: string]: number[] }
    expenseData: { [key: string]: number }
    carryData: { [key: string]: number[] }
    currentIndex: number;
    isOpen: boolean;
    onSubmit: (data: { [key: string]: number }) => void;
    onClose: () => void;
}

const CarryConfirmationModal: FunctionComponent<CarryConfirmationModalProps> = ({
    projectHeads,
    expenseData,
    carryData,
    currentIndex,
    isOpen,
    onSubmit,
    onClose,
}) => {
    const { register, handleSubmit, watch, setValue, formState: { dirtyFields } } = useForm({
        defaultValues:{
            ...(Object.keys(projectHeads).reduce((acc, head) => {
                acc[head] = carryData[head][currentIndex] ?? 0
                acc[`${head}_percent`] = (acc[head] / projectHeads[head][currentIndex]) * 100
                console.log(acc)
                return acc
            }, {} as  { [k: string] : number }))
        }
    });
    const [usePercentage, setUsePercentage] = useState(false);

    return (
        <Modal size="5xl" show={isOpen} onClose={onClose}>
            <Modal.Header className="text-xl font-semibold">Carry Forward Confirmation</Modal.Header>
            <Modal.Body>
                <form
                    onSubmit={handleSubmit((data) => {
                        const parsedData = Object.fromEntries(
                            Object.entries(data).filter(([key]) => !key.endsWith("_percent"))
                        )
                        onSubmit(parsedData);
                        onClose();
                    })}
                    className="space-y-6"
                >
                    <div className="flex justify-end">
                        <Label className="mr-2 font-medium">Use Percentage</Label>
                        <ToggleSwitch
                            checked={usePercentage}
                            onChange={() => setUsePercentage(!usePercentage)}
                            theme={{
                                toggle: {
                                    checked: {
                                        color: {
                                            blue: "border-blue-700 bg-blue-700 outline-none",
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                    <Table className="w-full border border-gray-300 text-left text-sm text-gray-900">
                        <Table.Head className="bg-gray-200 text-gray-700 text-md font-semibold">
                            <Table.HeadCell className="bg-inherit">Project Head</Table.HeadCell>
                            <Table.HeadCell className="bg-inherit">Current Year Amount</Table.HeadCell>
                            {usePercentage && <Table.HeadCell className="bg-inherit">Percentage Carry Over</Table.HeadCell>}
                            <Table.HeadCell className="bg-inherit">Carry Over Amount</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {Object.entries(projectHeads).map(([projectHead, alloc], i) => {
                                const balancePerHead = alloc[currentIndex] - (expenseData[projectHead] ?? 0) + (currentIndex ? carryData[projectHead][currentIndex - 1] ?? 0 : 0)
                                const percentage = watch(`${projectHead}_percent`) || 0;
                                if (percentage > 100) setValue(`${projectHead}_percent`, 100)
                                else if (percentage < 0) setValue(`${projectHead}_percent`, 0)
                                if (dirtyFields[projectHead] && usePercentage) setValue(projectHead, balancePerHead * (percentage / 100));
                                return (
                                    <Table.Row key={`${projectHead}_${i}`}>
                                        <Table.Cell className="font-semibold text-gray-900">{projectHead}</Table.Cell>
                                        <Table.Cell>
                                            <span className="bg-gray-50 border-none">{formatCurrency(balancePerHead)}</span>
                                        </Table.Cell>
                                        {usePercentage && (
                                            <Table.Cell>
                                                <div className="flex">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.1}
                                                        {...register(`${projectHead}_percent`, {
                                                            valueAsNumber: true,
                                                        })}
                                                        defaultValue={0}
                                                        className="border-gray-200 w-20 rounded-l-lg"
                                                    />
                                                    <span className="w-5 flex justify-center items-center bg-gray-300 rounded-r-lg">%</span>
                                                </div>
                                            </Table.Cell>
                                        )}
                                        <Table.Cell>
                                            <div className="flex">
                                                <span className="w-5 flex justify-center items-center bg-gray-300 rounded-l-lg">₹</span>
                                                <input
                                                    type="number"
                                                    {...register(projectHead, { valueAsNumber: true })}
                                                    {...(usePercentage ? { readOnly: true } : {})}
                                                    {...(balancePerHead >= 0 ? { max: balancePerHead }: { min: balancePerHead })}
                                                    className="border-gray-200 w-full rounded-l-lg"
                                                />
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                    <div className="flex justify-end mt-4">
                        <Button className="p-2" type="submit" color="blue">Submit</Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default CarryConfirmationModal;