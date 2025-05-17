import { Button, Label, Modal, TextInput, Radio, Textarea, Checkbox } from "flowbite-react";
import { Dispatch, FormEventHandler, FunctionComponent, SetStateAction, useEffect, useState } from "react";
import { toastError, toastSuccess } from "../toasts";
import { Member } from "../types";

interface AddProjectProps {
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
}

export const AddProjectModal: FunctionComponent<AddProjectProps> = ({ openModal, setOpenModal }) => {
  const [fundingAgency, setFundingAgency] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("yearly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [projectHeads, setProjectHeads] = useState<{ [key: string]: number[] }>({});
  const [headTotals, setHeadTotals] = useState<{ [key: string]: number }>({});
  const [numberOfYears, setNumberOfYears] = useState<number>(0);
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(0);
  const [newHeadName, setNewHeadName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sanctionLetter, setSanctionLetter] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [faculties, setFaculties] = useState<Array<Member>>([])
  const [negativeHeads, setNegativeHeads] = useState<Array<string>>([])
  const [projectID, setProjectID] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});



  const [pis, setPIs] = useState<string[]>([]);
  const [newPI, setNewPI] = useState<string>("");
  const [coPIs, setCoPIs] = useState<string[]>([]);
  const [newCoPI, setNewCoPI] = useState<string>("");


  const [installmentDates, setInstallmentDates] = useState<{ start_date: string; end_date: string }[]>([]);

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/member?type=faculty`, {
        credentials: 'include',
      });
      const data = await response.json();
      setFaculties(data);
    } catch (error) {
      toastError('Error fetching members');
      console.error('Error fetching members:', error);
    }
  };

  const calculateNumberOfYears = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);


      const startYear = start.getMonth() < 3 ? start.getFullYear() - 1 : start.getFullYear();
      const endYear = end.getMonth() < 3 ? end.getFullYear() - 1 : end.getFullYear();

      const yearsDiff = endYear - startYear + 1;
      setNumberOfYears(yearsDiff >= 1 ? yearsDiff : 0);
    }
  };
  useEffect(calculateNumberOfYears, [startDate, endDate]);

  const addProjectHead = () => {

    if (!newHeadName || (projectType === "yearly" && numberOfYears <= 0) || (projectType === "invoice" && numberOfInstallments <= 0)) {
      return;
    }


    const count = projectType === "yearly" ? numberOfYears : numberOfInstallments;


    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [newHeadName.trim()]: Array(count).fill(0),
    }));

    setEditMode((prev) => ({ ...prev, [newHeadName.trim()]: true }))


    setNewHeadName("");
  };

  const handleProjectHeadYearChange = (headName: string, index: number, value: number) => {
    setProjectHeads((prevHeads) => ({
      ...prevHeads,
      [headName]: prevHeads[headName].map((val, idx) => (idx === index ? value : val)),
    }));
  };

  const saveProjectHead = (headName: string) => {
    const headTotal = projectHeads[headName].reduce((acc, val) => acc + val, 0);

    setHeadTotals((prevTotals) => ({
      ...prevTotals,
      [headName]: headTotal,
    }));

    setEditMode((prevEditMode) => ({
      ...prevEditMode,
      [headName]: false,
    }));
  };


  const deleteProjectHead = (headName: string) => {
    const updatedHeads = { ...projectHeads };
    const updatedHeadTotals = { ...headTotals };
    delete updatedHeads[headName];
    delete updatedHeadTotals[headName];
    setProjectHeads(updatedHeads);
    setHeadTotals(updatedHeadTotals);
  };


  const addPI = () => {
    if (newPI) {
      setPIs((prevPIs) => [...prevPIs, newPI]);
      setNewPI("");
    }
  };

  const deletePI = (index: number) => {
    setPIs((prevPIs) => prevPIs.filter((_, i) => i !== index));
  };

  const addCoPI = () => {
    if (newCoPI) {
      setCoPIs((prevCoPIs) => [...prevCoPIs, newCoPI]);
      setNewCoPI("");
    }
  };

  const deleteCoPI = (index: number) => {
    setCoPIs((prevCoPIs) => prevCoPIs.filter((_, i) => i !== index));
  };

  const handleAddProject: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);

    const totalAmount = Object.values(headTotals).reduce((sum, value) => sum + value, 0);

    const payload = {
      funding_agency: fundingAgency,
      project_id: projectID,
      project_title: projectTitle,
      start_date: startDate ? new Date(startDate).toISOString() : "",
      end_date: endDate ? new Date(endDate).toISOString() : "",
      total_amount: totalAmount,
      project_type: projectType,
      pis,
      copis: coPIs,
      project_heads: projectHeads,
      negative_heads: negativeHeads,
      description,
    };

    if (projectType === "invoice" && numberOfInstallments > 0) {
      (payload as any).installments = installmentDates;
    }

    if (sanctionLetter) {
      (payload as any).sanction_letter_url = sanctionLetter;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toastSuccess("Project added");
        setOpenModal(false);
      } else {
        toastError("Error adding project");
      }
    } catch (e) {
      toastError("Error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!openModal) {
      setFundingAgency("");
      setStartDate("");
      setEndDate("");
      setProjectHeads({});
      setHeadTotals({});
      setNumberOfYears(0);
      setNumberOfInstallments(0);
      setPIs([]);
      setCoPIs([]);
      setSanctionLetter(null);
      setInstallmentDates([]);
    }
    else fetchFaculties()
  }, [openModal]);

  return (
    <div>
      <Modal show={openModal} size="4xl" popup onClose={() => setOpenModal(false)}>
        <Modal.Header className="p-5">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Add New Project</h3>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="grid grid-cols-3 gap-x-4">
              <div>
                <Label htmlFor="projectID" value="Project ID" />
                <TextInput
                  id="projectID"
                  type="text"
                  placeholder="Enter Project ID"
                  required
                  value={projectID}
                  onChange={(e) => setProjectID(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="funding_agency" value="Funding Agency" />
                <TextInput
                  id="funding_agency"
                  placeholder="Enter Funding Agency"
                  value={fundingAgency}
                  onChange={(e) => setFundingAgency(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="project_title" value="Project Title" />
                <TextInput
                  id="project_title"
                  type="text"
                  placeholder="Enter Project Title (optional)"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

            </div>

            {/* PIs and Co-PIs */}
            <div className="flex justify-between">
              <div className="space-y-2">
                <Label htmlFor="pi" value="Add Principal Investigators (PIs)" />
                <div className="flex items-center space-x-3">
                  <select
                    id="pi"
                    value={newPI}
                    onChange={(e) => setNewPI(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="">Select PI</option>
                    {faculties.map((faculty) => (
                      <option value={faculty._id} key={faculty._id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  <Button color="blue" onClick={addPI} disabled={!newPI}>Add PI</Button>
                </div>
                {pis.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold">PIs:</h4>
                    <ul>
                      {pis.map((pi, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{faculties.find(faculty => faculty._id === pi)?.name}</span>
                          <Button
                            color="blue"
                            onClick={() => deletePI(idx)}
                            type="button"
                            size="xs"
                          >
                            Delete
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label value="Add Co-Principal Investigators (Co-PIs)" />
                <div className="flex items-center space-x-3">
                  <select
                    value={newCoPI}
                    onChange={(e) => setNewCoPI(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="">Select Co-PI</option>
                    {faculties.map((faculty) => (
                      <option value={faculty._id} key={faculty._id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  <Button color="blue" onClick={addCoPI} disabled={!newCoPI}>Add Co-PI</Button>
                </div>
                {coPIs.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold">Co-PIs:</h4>
                    <ul>
                      {coPIs.map((coPI, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{faculties.find(faculty => faculty._id === coPI)?.name}</span>
                          <Button
                            color="blue"
                            onClick={() => deleteCoPI(idx)}
                            type="button"
                            size="xs"
                          >
                            Delete
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label value="Project Type" />
              <div className="flex space-x-4">
                <Radio
                  id="yearly"
                  name="projectType"
                  value="yearly"
                  checked={projectType === "yearly"}
                  onChange={() => setProjectType("yearly")}
                />
                <Label htmlFor="yearly" value="Yearly" />

                <Radio
                  id="invoice"
                  name="projectType"
                  value="invoice"
                  checked={projectType === "invoice"}
                  onChange={() => setProjectType("invoice")}
                />
                <Label htmlFor="invoice" value="Invoice" />
              </div>
            </div>

            <div className="flex space-x-3">
              <div className="w-1/2">
                <Label htmlFor="start_date" value="Start Date" />
                <TextInput
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="w-1/2">
                <Label htmlFor="end_date" value="End Date" />
                <TextInput
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {projectType === "invoice" ? (
              <div>
                <Label htmlFor="installments" value="Number of Installments" />
                <TextInput
                  id="installments"
                  type="number"
                  value={numberOfInstallments}
                  onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                  required
                />

                {numberOfInstallments > 0 && (
                  <div className="grid grid-cols-2 gap-y-6 mt-3">
                    {Array.from({ length: numberOfInstallments }).map((_, index) => (
                      <div key={index} className="flex space-x-2">
                        <div>
                          <Label htmlFor={`installment_start_${index}`} value={`Installment ${index + 1} Start Date`} />
                          <TextInput
                            id={`installment_start_${index}`}
                            type="date"
                            min={index ? installmentDates[index - 1]?.end_date ?? startDate ?? "" : startDate ?? ""}
                            value={installmentDates[index]?.start_date || ""}
                            onChange={(e) => {
                              const updatedDates = [...installmentDates];
                              updatedDates[index] = {
                                ...updatedDates[index],
                                start_date: e.target.value,
                              };
                              setInstallmentDates(updatedDates);
                            }}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`installment_end_${index}`} value={`Installment ${index + 1} End Date`} />
                          <TextInput
                            id={`installment_end_${index}`}
                            type="date"
                            value={installmentDates[index]?.end_date || ""}
                            max={index === (numberOfInstallments - 1) ? endDate ?? "" : ""}
                            onChange={(e) => {
                              const updatedDates = [...installmentDates];
                              updatedDates[index] = {
                                ...updatedDates[index],
                                end_date: e.target.value,
                              };
                              setInstallmentDates(updatedDates);
                            }}
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <div>
              <Label htmlFor="years" value="Number of Years" />
              <TextInput id="years" type="number" value={numberOfYears} readOnly />
            </div>}

            {/* Project Heads section */}
            <div>
              <Label htmlFor="head_name" value="Project Head" />
              <div className="flex items-center space-x-3">
                <TextInput
                  id="head_name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="Enter head name"
                />
                <Button color="blue" onClick={addProjectHead}>Add Project Head</Button>
              </div>
              {Object.keys(projectHeads).map((head) => (
                <div key={head} className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg">{head}</h4>
                      <Checkbox
                        id={`${head}_neg_checkbox`}
                        checked={negativeHeads.includes(head)}
                        onChange={() => {
                          if (negativeHeads.includes(head)) {
                            setNegativeHeads(negativeHeads.filter((negativeHead) => negativeHead !== head));
                          } else {
                            setNegativeHeads([...negativeHeads, head]);
                          }
                        }}
                      />
                      <Label value="Allow Negative Values" htmlFor={`${head}_neg_checkbox`} />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button color="green" size="xs" onClick={() => saveProjectHead(head)}>
                        Save
                      </Button>
                      <Button
                        color="yellow"
                        size="xs"
                        onClick={() => {
                          setEditMode((prev) => ({ ...prev, [head]: true }));
                        }}
                      >
                        Edit
                      </Button>
                      <Button color="red" size="xs" onClick={() => deleteProjectHead(head)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3">
                    {projectHeads[head].map((value, idx) => (
                      editMode[head] ? <div key={idx} className="mt-2 space-y-2">
                        <Label htmlFor={`${head}_${idx}`} value={`${projectType === "invoice" ? "Installment" : 'Year'} ${idx + 1}`} />
                        <TextInput
                          id={`${head}_${idx}`}
                          type="number"
                          value={value}
                          onChange={(e) =>
                            handleProjectHeadYearChange(head, idx, Number(e.target.value))
                          }
                          required
                        />
                      </div> :
                        <div className="flex flex-col">
                          <span className="font-semibold">Year {idx + 1}</span>
                          <span>{value}</span>
                        </div>
                    ))}
                    <div className="flex flex-col">
                      <span className="font-bold">Total</span>
                      <span>{headTotals[head]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <Label htmlFor="total_amount" value="Total Amount" />
                <TextInput
                  id="total_amount"
                  type="number"
                  readOnly
                  value={Object.values(headTotals).reduce((sum, value) => sum + value, 0) ?? ""}
                />
              </div>

              <div>
                <Label htmlFor="description" value="Project Description" />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <Label htmlFor="sanction_letter" value="Sanction Letter Link" />
                <TextInput
                  id="sanction_letter"
                  value={sanctionLetter ?? ""}
                  onChange={(e) => setSanctionLetter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-center space-x-3 mt-4">
              <Button color="blue" type="submit" disabled={loading}>Save Project</Button>
              <Button color="failure" onClick={() => setOpenModal(false)} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  )
};
