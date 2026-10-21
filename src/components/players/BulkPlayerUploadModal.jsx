import React, { useState, useRef } from "react";
import {
    UploadCloud,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Download,
    RefreshCw,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    FileCheck2,
    Search,
    ArrowLeft,
    Target,
    Zap,
    ShieldCheck,
    Users,
    User,
    Check
} from "lucide-react";
import * as XLSX from "xlsx";
import { bulkUploadPlayers, downloadPlayerTemplate } from "../../services/playerService";
import { toast } from "react-hot-toast";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0 Pts";
    return new Intl.NumberFormat("en-IN").format(val) + " Pts";
};

const ROLE_CONFIG = {
    Batsman: { color: "bg-blue-500/15 text-blue-400 border border-blue-500/25", icon: Target },
    Batter: { color: "bg-blue-500/15 text-blue-400 border border-blue-500/25", icon: Target },
    Bowler: { color: "bg-red-500/15 text-red-400 border border-red-500/25", icon: Zap },
    "All-Rounder": { color: "bg-purple-500/15 text-purple-400 border border-purple-500/25", icon: ShieldCheck },
    "Wicket-Keeper": { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    Wicketkeeper: { color: "bg-amber-500/15 text-amber-400 border border-amber-500/25", icon: Users },
    default: { color: "bg-gray-500/15 text-gray-400 border border-gray-500/25", icon: User },
};

const findFieldValue = (row, possibleKeys) => {
    const keys = Object.keys(row);
    for (const key of keys) {
        const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, "");
        if (possibleKeys.includes(cleanKey)) {
            return row[key];
        }
    }
    return undefined;
};

const parseSpreadsheetFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("The uploaded spreadsheet does not contain any readable sheets.");
    }

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

    const parsedPlayers = [];
    const clientErrors = [];

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNumber = i + 2; // Row 1 is header

        const values = Object.values(row);
        const isCompletelyEmpty = values.every(
            (val) => val === null || val === undefined || String(val).trim() === ""
        );
        if (isCompletelyEmpty) continue;

        const rawName = findFieldValue(row, ["name", "playername", "player", "fullname", "player_name"]);
        const name = rawName !== undefined && rawName !== null ? String(rawName).trim() : "";

        const rawRole = findFieldValue(row, ["role", "playerrole", "position", "category", "type", "player_role"]);
        const role = rawRole !== undefined && rawRole !== null ? String(rawRole).trim() : "";

        const rawPrice = findFieldValue(row, ["baseprice", "price", "base", "amount", "base_price", "startingprice"]);
        let basePrice = 0;
        let priceError = null;

        if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== "") {
            const rawPriceStr = String(rawPrice).trim();
            if (/^-\d+/.test(rawPriceStr)) {
                priceError = `Base price '${rawPriceStr}' cannot be negative`;
            } else {
                const withoutCommas = rawPriceStr.replace(/,/g, "");
                const sanitizedPrice = withoutCommas.replace(/[^0-9.]/g, "");
                const parsedFloat = parseFloat(sanitizedPrice);
                if (isNaN(parsedFloat) || parsedFloat < 0) {
                    priceError = `Invalid base price '${rawPriceStr}'`;
                } else {
                    basePrice = Math.floor(parsedFloat);
                }
            }
        }

        const issues = [];
        if (!name) issues.push("Missing name");
        if (!role) issues.push("Missing role");
        if (priceError) issues.push(priceError);

        const isValid = issues.length === 0;

        if (!isValid) {
            clientErrors.push({
                row: rowNumber,
                player: name || "Unnamed Player",
                reason: issues.join(", ")
            });
        }

        parsedPlayers.push({
            index: parsedPlayers.length + 1, // 1-based sequential player count (#1, #2, #3...)
            sheetRow: rowNumber,             // Line number in physical spreadsheet (Row 2, 3...)
            rowNumber,
            name: name || "Unnamed Player",
            role: role || "Unassigned",
            basePrice,
            isValid,
            issues
        });
    }

    return {
        players: parsedPlayers,
        clientErrors,
        totalRows: parsedPlayers.length,
        validCount: parsedPlayers.filter((p) => p.isValid).length,
        invalidCount: parsedPlayers.filter((p) => !p.isValid).length
    };
};

const BulkPlayerUploadModal = ({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    onSuccess
}) => {
    // Current step: "drop" | "preview" | "result"
    const [step, setStep] = useState("drop");

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parsingFile, setParsingFile] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Filter inside preview table
    const [previewSearch, setPreviewSearch] = useState("");
    const [previewRoleFilter, setPreviewRoleFilter] = useState("ALL");

    // Options
    const [uploading, setUploading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(null); // 'xlsx' | 'csv' | null
    const [validationError, setValidationError] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [showErrorsList, setShowErrorsList] = useState(true);

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const processSelectedFile = async (selectedFile) => {
        setValidationError(null);
        setUploadResult(null);

        if (!selectedFile) return;

        const fileName = selectedFile.name.toLowerCase();
        const isValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

        if (!isValidExtension) {
            setValidationError("Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.");
            setFile(null);
            setPreviewData(null);
            setStep("drop");
            return;
        }

        if (selectedFile.size > 15 * 1024 * 1024) {
            setValidationError("File is too large. Maximum allowed file size is 15 MB.");
            setFile(null);
            setPreviewData(null);
            setStep("drop");
            return;
        }

        setFile(selectedFile);
        setParsingFile(true);

        try {
            const parsed = await parseSpreadsheetFile(selectedFile);

            if (parsed.totalRows === 0) {
                setValidationError("The uploaded spreadsheet does not contain any player records.");
                setFile(null);
                setPreviewData(null);
                setStep("drop");
            } else {
                setPreviewData(parsed);
                setStep("preview");
            }
        } catch (err) {
            console.error("Spreadsheet parse error:", err);
            setValidationError(err.message || "Failed to read and parse spreadsheet file.");
            setFile(null);
            setPreviewData(null);
            setStep("drop");
        } finally {
            setParsingFile(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        processSelectedFile(selected);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files?.[0];
        processSelectedFile(droppedFile);
    };

    const handleDownloadTemplate = async (format) => {
        setDownloadingTemplate(format);
        try {
            await downloadPlayerTemplate(format);
            toast.success(`Downloaded ${format.toUpperCase()} template successfully!`);
        } catch (err) {
            console.error("Template download error:", err);
            toast.error(err.response?.data?.message || `Failed to download ${format.toUpperCase()} template.`);
        } finally {
            setDownloadingTemplate(null);
        }
    };

    const handleUploadAndImport = async () => {
        if (!file) {
            setValidationError("Please select an Excel or CSV file to upload.");
            return;
        }

        setUploading(true);
        setValidationError(null);

        try {
            const res = await bulkUploadPlayers(tournamentId, file, false);

            if (res.success) {
                setUploadResult(res);
                setStep("result");
                toast.success(res.message || `Successfully imported players into tournament!`);
                if (onSuccess) {
                    onSuccess(res.data);
                }
            } else {
                setValidationError(res.message || "Failed to process player upload.");
            }
        } catch (err) {
            console.error("Bulk upload error:", err);
            const errMsg = err.response?.data?.message || err.message || "Failed to upload players.";
            setValidationError(errMsg);
        } finally {
            setUploading(false);
        }
    };

    const resetUploadState = () => {
        setFile(null);
        setPreviewData(null);
        setValidationError(null);
        setUploadResult(null);
        setStep("drop");
        setPreviewSearch("");
        setPreviewRoleFilter("ALL");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleModalClose = () => {
        if (uploading) return;
        resetUploadState();
        onClose();
    };

    const isCsv = file?.name?.toLowerCase().endsWith(".csv");

    // Filter players for preview table
    const filteredPreviewPlayers = (previewData?.players || []).filter((p) => {
        if (previewRoleFilter !== "ALL") {
            const pRoleNorm = p.role.toLowerCase().replace(/[\s_-]+/g, "");
            const filterNorm = previewRoleFilter.toLowerCase().replace(/[\s_-]+/g, "");
            if (!pRoleNorm.includes(filterNorm) && !filterNorm.includes(pRoleNorm)) return false;
        }
        if (previewSearch.trim()) {
            const q = previewSearch.toLowerCase().trim();
            const matchesName = p.name.toLowerCase().includes(q);
            const matchesRole = p.role.toLowerCase().includes(q);
            if (!matchesName && !matchesRole) return false;
        }
        return true;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
                {/* Golden Top Band */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#FDB913] to-yellow-400" />

                {/* Header */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FDB913]/10 border border-[#FDB913]/25 flex items-center justify-center text-[#FDB913] shrink-0">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                                    Bulk Import Players
                                </h3>
                                {step === "preview" && (
                                    <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                        Step 2: Preview ({previewData?.totalRows || 0} Players)
                                    </span>
                                )}
                                {step === "result" && (
                                    <span className="text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                                        Completed
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Target Tournament: <strong className="text-[#FDB913] font-bold">{tournamentName || "Tournament"}</strong>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleModalClose}
                        disabled={uploading}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 flex-1">
                    {/* STEP 1: DROP / SELECT FILE */}
                    {step === "drop" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Template Helper Callout */}
                            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                        <Download size={15} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Need the official template?</p>
                                        <p className="text-[11px] text-gray-400">Download formatted template with Name, Role, BasePrice columns.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadTemplate("xlsx")}
                                        disabled={downloadingTemplate !== null}
                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 hover:text-emerald-300 transition cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingTemplate === "xlsx" ? (
                                            <RefreshCw size={13} className="animate-spin" />
                                        ) : (
                                            <FileSpreadsheet size={13} />
                                        )}
                                        <span>Excel (.xlsx)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDownloadTemplate("csv")}
                                        disabled={downloadingTemplate !== null}
                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-blue-400 hover:text-blue-300 transition cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingTemplate === "csv" ? (
                                            <RefreshCw size={13} className="animate-spin" />
                                        ) : (
                                            <FileText size={13} />
                                        )}
                                        <span>CSV (.csv)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-3 ${isDragging
                                    ? "border-[#FDB913] bg-[#FDB913]/10 scale-[1.01]"
                                    : "border-white/15 bg-white/[0.02] hover:border-[#FDB913]/50 hover:bg-white/[0.04]"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {parsingFile ? (
                                    <div className="space-y-2 flex flex-col items-center py-4">
                                        <RefreshCw size={32} className="text-[#FDB913] animate-spin" />
                                        <p className="text-sm font-bold text-white">Reading and validating spreadsheet...</p>
                                        <p className="text-xs text-gray-400">Extracting player roster and role information</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 flex flex-col items-center">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${isDragging ? "bg-[#FDB913]/20 text-[#FDB913] scale-110" : "bg-white/5 text-gray-400 border border-white/10"
                                            }`}>
                                            <UploadCloud size={28} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-white">
                                                Drop your spreadsheet here, or <span className="text-[#FDB913] underline">browse files</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Supports Microsoft Excel (<strong className="text-gray-300">.xlsx, .xls</strong>) and CSV (<strong className="text-gray-300">.csv</strong>) up to 15MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW PLAYERS LIST */}
                    {step === "preview" && previewData && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Selected File Card Bar */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCsv ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        }`}>
                                        {isCsv ? <FileText size={18} /> : <FileCheck2 size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                                            {file?.name}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-mono">
                                            {formatBytes(file?.size)} • {previewData.totalRows} player rows detected
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={resetUploadState}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer self-start sm:self-auto shrink-0"
                                >
                                    <ArrowLeft size={12} /> Change File
                                </button>
                            </div>

                            {/* Summary Chips Grid */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Players</span>
                                    <span className="text-base sm:text-lg font-black font-mono text-white mt-0.5 block">
                                        {previewData.totalRows}
                                    </span>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Valid to Import</span>
                                    <span className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5 block">
                                        {previewData.validCount}
                                    </span>
                                </div>
                                <div className={`rounded-xl p-2.5 text-center border ${previewData.invalidCount > 0 ? "bg-amber-500/10 border-amber-500/25" : "bg-white/[0.02] border-white/5"
                                    }`}>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Issues / Incomplete</span>
                                    <span className={`text-base sm:text-lg font-black font-mono mt-0.5 block ${previewData.invalidCount > 0 ? "text-amber-400" : "text-gray-500"
                                        }`}>
                                        {previewData.invalidCount}
                                    </span>
                                </div>
                            </div>

                            {/* Search and Role Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by player name or role in preview..."
                                        value={previewSearch}
                                        onChange={(e) => setPreviewSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#080E27] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913]/60 transition"
                                    />
                                </div>

                                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                                    {["ALL", "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setPreviewRoleFilter(r)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${previewRoleFilter === r
                                                ? "bg-[#FDB913] text-black font-black shadow-sm"
                                                : "bg-white/5 hover:bg-white/10 text-gray-300"
                                                }`}
                                        >
                                            {r === "ALL" ? "All Roles" : r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Players Preview Table */}
                            <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02] shadow-inner">
                                <div className="max-h-60 sm:max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="sticky top-0 bg-[#080E27] text-gray-400 font-bold border-b border-white/10 text-[10px] uppercase tracking-wider z-10">
                                            <tr>
                                                <th className="py-2.5 px-3 w-12 text-center">Row</th>
                                                <th className="py-2.5 px-3">Player Name</th>
                                                <th className="py-2.5 px-3">Role</th>
                                                <th className="py-2.5 px-3 text-right">Base Points</th>
                                                <th className="py-2.5 px-3 text-center w-24">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.05]">
                                            {filteredPreviewPlayers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-xs text-gray-500">
                                                        No player records match your search filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPreviewPlayers.map((p, idx) => {
                                                    const roleCfg = ROLE_CONFIG[p.role] || ROLE_CONFIG.default;
                                                    const RoleIcon = roleCfg.icon;
                                                    const initials = p.name ? p.name.slice(0, 2).toUpperCase() : "P";
                                                    return (
                                                        <tr key={idx} className="hover:bg-white/[0.03] transition">
                                                            <td
                                                                className="py-2 px-3 text-center font-mono text-[10px] text-gray-500"
                                                                title={p.sheetRow ? `Excel Row ${p.sheetRow}` : undefined}
                                                            >
                                                                #{p.index || (idx + 1)}
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-black text-[10px] font-black flex items-center justify-center shrink-0">
                                                                        {initials}
                                                                    </div>
                                                                    <span className="font-extrabold text-white text-xs truncate max-w-[180px] sm:max-w-xs">
                                                                        {p.name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleCfg.color}`}>
                                                                    <RoleIcon size={10} />
                                                                    {p.role}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-200">
                                                                {formatCurrency(p.basePrice)}
                                                            </td>
                                                            <td className="py-2 px-3 text-center">
                                                                {p.isValid ? (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                        <Check size={10} /> Ready
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        title={p.issues.join(", ")}
                                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 cursor-help"
                                                                    >
                                                                        <AlertTriangle size={10} /> Issue
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULT VIEW */}
                    {step === "result" && uploadResult && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                                <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold text-white">
                                        Import Completed Successfully!
                                    </h4>
                                    <p className="text-xs text-gray-300">
                                        {uploadResult.message || `Players have been imported into ${tournamentName}.`}
                                    </p>
                                </div>
                            </div>

                            {/* Summary Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Processed</span>
                                    <span className="text-lg font-black font-mono text-white mt-0.5 block">
                                        {uploadResult.data?.totalRowsProcessed ?? uploadResult.data?.importedCount ?? 0}
                                    </span>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Imported</span>
                                    <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
                                        {uploadResult.data?.importedCount ?? 0}
                                    </span>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Skipped</span>
                                    <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">
                                        {uploadResult.data?.skippedCount ?? 0}
                                    </span>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Invalid</span>
                                    <span className="text-lg font-black font-mono text-rose-400 mt-0.5 block">
                                        {uploadResult.data?.invalidRowsCount ?? 0}
                                    </span>
                                </div>
                            </div>

                            {/* Skipped / Error Rows Breakdown */}
                            {uploadResult.data?.errors && uploadResult.data.errors.length > 0 && (
                                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                                    <button
                                        type="button"
                                        onClick={() => setShowErrorsList(!showErrorsList)}
                                        className="w-full px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-300 transition cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-amber-400" />
                                            <span>Skipped / Notice Details ({uploadResult.data.errors.length} records)</span>
                                        </div>
                                        {showErrorsList ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>

                                    {showErrorsList && (
                                        <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.06] scrollbar-thin scrollbar-thumb-white/10">
                                            {uploadResult.data.errors.map((errItem, idx) => (
                                                <div key={idx} className="p-3 text-xs flex items-start gap-2.5 hover:bg-white/[0.02]">
                                                    <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[10px] font-bold text-gray-300 shrink-0">
                                                        Row {errItem.row || idx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        {errItem.player && (
                                                            <span className="font-bold text-white mr-1.5">{errItem.player}:</span>
                                                        )}
                                                        <span className="text-gray-300">{errItem.reason || errItem.message || "Skipped or invalid record"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Validation or API Error Banner */}
                    {validationError && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200">
                            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <strong className="font-bold block text-rose-200">Upload Issue:</strong>
                                <span>{validationError}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0 bg-[#070D1E]/60">
                    {step === "drop" && (
                        <>
                            <button
                                type="button"
                                onClick={handleModalClose}
                                disabled={parsingFile}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-transparent hover:bg-white/5 transition disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={parsingFile}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#FDB913] hover:bg-[#FDB913]/90 text-black transition shadow-lg shadow-yellow-500/20 cursor-pointer hover:scale-105 active:scale-95"
                            >
                                <UploadCloud size={15} />
                                <span>Select Spreadsheet</span>
                            </button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <button
                                type="button"
                                onClick={resetUploadState}
                                disabled={uploading}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-transparent hover:bg-white/5 transition disabled:opacity-50 cursor-pointer"
                            >
                                <ArrowLeft size={13} />
                                <span>Choose Different File</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleUploadAndImport}
                                disabled={!file || uploading || (previewData?.validCount === 0)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#FDB913] hover:bg-[#FDB913]/90 text-black transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95"
                            >
                                {uploading ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Importing {previewData?.validCount || ""} Players...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={15} />
                                        <span>Upload & Import ({previewData?.validCount || 0} Players)</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === "result" && (
                        <>
                            <button
                                type="button"
                                onClick={resetUploadState}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                            >
                                Import Another File
                            </button>
                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FDB913] hover:bg-[#FDB913]/90 text-black transition shadow-lg shadow-yellow-500/20 cursor-pointer"
                            >
                                Done & View Roster
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkPlayerUploadModal;
