// @ts-nocheck the react-pdf-table package has some typing issues

import NotoSansRegular from "../assets/fonts/Noto_Sans/static/NotoSans-Regular.ttf";
import NotoSansBold from "../assets/fonts/Noto_Sans/static/NotoSans-Bold.ttf";
import NotoSansSemiBold from "../assets/fonts/Noto_Sans/static/NotoSans-SemiBold.ttf";

import {
    Table,
    TableHeader,
    TableCell,
    TableBody,
    DataTableCell,
} from '@david.kucsai/react-pdf-table'
import {
    Document,
    Page,
    PDFViewer,
    Text,
    Font,
} from '@react-pdf/renderer'
import { formatCurrency } from '../helper'
import { Project } from '../types'
import { Button } from 'flowbite-react'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { toastError } from '../toasts'

Font.register({
    family: 'Noto Sans',
    fonts: [
        { src: NotoSansRegular, fontWeight: 'normal' }, // 400
        { src: NotoSansSemiBold, fontWeight: '600' },    // 600
        { src: NotoSansBold, fontWeight: 'bold' },       // 700
    ],
});

interface Row {
    head: string
    initialAmount: number
    carryForward: number
    totalCurrent: number
    expenses: number
    balance: number
}

const MyDoc = ({
    data,
    year,
}: {
    data: { project: Project; project_head_expenses: Record<string, number> }
    year: string
}) => {
    const selectedYear = parseInt(year);
    const { project: projectData, project_head_expenses: expenseData } = data;

    // flatten into an array of simple objects
    const rows: Row[] = Object.entries(projectData.project_heads).map(
        ([head, allocations]) => {
            const initialAmount = allocations[selectedYear] || 0;
            const carryForward =
                projectData.carry_forward[head]?.[selectedYear - 1] || 0;
            const totalCurrent = initialAmount + carryForward;
            const expenses = expenseData[head] || 0;
            const balance = totalCurrent - expenses;

            return {
                head,
                initialAmount,
                carryForward,
                totalCurrent,
                expenses,
                balance,
            };
        }
    );

    // total row
    const total: Row = rows.reduce(
        (acc, r) => ({
            head: 'Total',
            initialAmount: acc.initialAmount + r.initialAmount,
            carryForward: acc.carryForward + r.carryForward,
            totalCurrent: acc.totalCurrent + r.totalCurrent,
            expenses: acc.expenses + r.expenses,
            balance: acc.balance + r.balance,
        }),
        { head: '', initialAmount: 0, carryForward: 0, totalCurrent: 0, expenses: 0, balance: 0 }
    );
    rows.push(total);

    return (
        <Document title={`${projectData.project_id}-${projectData.funding_agency}_SA`}>
            <Page size="A4" style={{ padding: 20, fontFamily: 'Noto Sans' }}>

                <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 }}>
                    LAMBDA
                </Text>

                <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 5 }}>
                    Laboratory for Antenna, Microwave and e-Beam Devices, and Applications
                </Text>

                <Text style={{ fontSize: 8, textAlign: 'center', marginBottom: 20 }}>
                Birla Institute of Technology And Science - Pilani, Hyderabad Campus
                </Text>

                {/* Title */}
                <Text style={{ fontSize: 14, textDecoration: 'underline', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
                    Statement of Accounts
                </Text>

                {/* Project Information */}
                <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Project Title: </Text>
                    {projectData.project_title}
                </Text>
                <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Funding Agency: </Text>
                    {projectData.funding_agency}
                </Text>
                <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Project ID: </Text>
                    {projectData.project_id}
                </Text>
                <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Year: </Text>
                    {selectedYear + 1}
                </Text>

                <Text style={{ fontSize: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>PIs: </Text>
                    { projectData.pis.length ? projectData.pis.map(pi => pi.name).join(' ,') : 'None Specified' }
                </Text>

                <Text style={{ fontSize: 12, marginBottom: 20 }}>
                    <Text style={{ fontWeight: 'bold' }}>Co-PIs: </Text>
                    { projectData.copis.length ? projectData.copis.map(pi => pi.name).join(' ,') : 'None Specified' }
                </Text>

                {/* Table */}
                <Table data={rows}>
                    <TableHeader textAlign="center" fontSize={10}>
                        <TableCell><Text style={{ fontWeight: 700 }}>Head</Text></TableCell>
                        <TableCell><Text style={{ fontWeight: 700 }}>Initial Amount</Text></TableCell>
                        <TableCell><Text style={{ fontWeight: 700 }}>Carry Forward</Text></TableCell>
                        <TableCell><Text style={{ fontWeight: 700 }}>Total Current</Text></TableCell>
                        <TableCell><Text style={{ fontWeight: 700 }}>Expenses</Text></TableCell>
                        <TableCell><Text style={{ fontWeight: 700 }}>Balance</Text></TableCell>
                    </TableHeader>

                    <TableBody>
                        <DataTableCell getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{r.head}</Text>} />
                        <DataTableCell
                            getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{formatCurrency(r.initialAmount)}</Text>}
                        />
                        <DataTableCell
                            getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{formatCurrency(r.carryForward)}</Text>}
                        />
                        <DataTableCell
                            getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{formatCurrency(r.totalCurrent)}</Text>}
                        />
                        <DataTableCell
                            getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{formatCurrency(r.expenses)}</Text>}
                        />
                        <DataTableCell
                            getContent={(r: Row) => <Text {...(r.head === 'Total' && { style: { fontWeight: 700 } })}>{formatCurrency(r.balance)}</Text>}
                        />
                    </TableBody>
                </Table>
            </Page>
        </Document>
    );
};

export default MyDoc;

export const ProjectSAViewer = () => {
    const { id } = useParams()
    const [ searchParams ] = useSearchParams()
    const year = searchParams.get('index')
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${id}/total-expenses?projectData=true`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(setData)
            .catch(e => {
                toastError("Something went wrong")
                console.error(e)
            })
    }, [id, year])

    return (
        <div className="projectSAPDFViewer w-full p-2 flex flex-col space-y-4">
            {!!year && !!data && (
                <div className="mt-4 w-full h-[90vh] border">
                    <PDFViewer className="w-full h-full">
                        <MyDoc data={data} year={year} />
                    </PDFViewer>
                </div>
            )}
        </div>
    )
}