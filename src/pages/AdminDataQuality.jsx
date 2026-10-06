import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    Search, AlertTriangle, CheckCircle2, FileWarning, 
    Calendar, Database, Loader2, ShieldAlert, Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDataQuality() {
    const [user, setUser] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState(null);
    const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
    const [duplicateResults, setDuplicateResults] = useState(null);

    React.useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await apiClient.auth.me();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            }
        };
        checkUser();
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        setScanResults(null);
        
        try {
            toast.loading('Scanning database...', { id: 'scan' });
            
            const currentYear = new Date().getFullYear();
            const issues = {
                corrupted_text: [],
                missing_fields: [],
                outdated_deadlines: [],
                fixed_records: []
            };
            
            // Fetch all universities
            const universities = await apiClient.entities.University.list(null, 5000);
            
            // Helper functions
            const hasCorruptedText = (text) => {
                if (!text || typeof text !== 'string') return false;
                const corruptionPatterns = [
                    /\?:\(\?\*:\?:%+\)/,
                    /[^\x00-\x7F]{10,}/,
                    /[\x00-\x1F\x7F-\x9F]{3,}/,
                    /�{2,}/,
                    /<[^>]{100,}>/
                ];
                return corruptionPatterns.some(pattern => pattern.test(text));
            };
            
            const cleanText = (text) => {
                if (!text || typeof text !== 'string') return text;
                return text
                    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                    .replace(/�/g, '')
                    .replace(/\?:\(\?\*:\?:%+\)/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };
            
            const isOutdatedDate = (dateStr) => {
                if (!dateStr || typeof dateStr !== 'string') return false;
                try {
                    const year = parseInt(dateStr.split('-')[0]);
                    return year < currentYear;
                } catch {
                    return false;
                }
            };
            
            const updateDeadline = (dateStr) => {
                if (!dateStr || typeof dateStr !== 'string') return dateStr;
                try {
                    const [year, month, day] = dateStr.split('-');
                    const oldYear = parseInt(year);
                    if (oldYear < currentYear) {
                        const monthNum = parseInt(month);
                        const newYear = monthNum >= 9 ? currentYear + 1 : currentYear;
                        return `${newYear}-${month}-${day}`;
                    }
                } catch {
                    return dateStr;
                }
                return dateStr;
            };
            
            const scanObject = (obj, path = '') => {
                const problems = { corrupted: [], missing: [] };
                if (!obj || typeof obj !== 'object') return problems;
                
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (value === null || value === undefined || value === '') {
                        problems.missing.push(currentPath);
                    } else if (typeof value === 'string') {
                        if (hasCorruptedText(value)) {
                            problems.corrupted.push({ path: currentPath, value });
                        }
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        const nested = scanObject(value, currentPath);
                        problems.corrupted.push(...nested.corrupted);
                        problems.missing.push(...nested.missing);
                    } else if (Array.isArray(value)) {
                        value.forEach((item, idx) => {
                            if (typeof item === 'object') {
                                const nested = scanObject(item, `${currentPath}[${idx}]`);
                                problems.corrupted.push(...nested.corrupted);
                                problems.missing.push(...nested.missing);
                            } else if (typeof item === 'string' && hasCorruptedText(item)) {
                                problems.corrupted.push({ path: `${currentPath}[${idx}]`, value: item });
                            }
                        });
                    }
                }
                return problems;
            };
            
            const cleanObject = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                const cleaned = Array.isArray(obj) ? [] : {};
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string') {
                        cleaned[key] = cleanText(value);
                    } else if (typeof value === 'object' && value !== null) {
                        cleaned[key] = cleanObject(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            };
            
            // Process each university
            for (const university of universities) {
                const universityId = university.id;
                const data = university;
                let needsUpdate = false;
                let updatedData = { ...data };
                
                // Detection
                const problems = scanObject(data);
                const hasTextErrors = problems.corrupted.length > 0;
                const hasMissingFields = problems.missing.length > 0;
                const hasOutdatedDeadline = 
                    isOutdatedDate(data.application_deadline) || 
                    (data.scholarships || []).some(s => isOutdatedDate(s.deadline));
                
                // Log issues
                if (hasTextErrors) {
                    issues.corrupted_text.push({
                        id: universityId,
                        name: data.name,
                        problems: problems.corrupted
                    });
                }
                
                if (hasMissingFields) {
                    issues.missing_fields.push({
                        id: universityId,
                        name: data.name,
                        fields: problems.missing
                    });
                }
                
                if (hasOutdatedDeadline) {
                    issues.outdated_deadlines.push({
                        id: universityId,
                        name: data.name,
                        deadline: data.application_deadline,
                        scholarship_deadlines: (data.scholarships || []).map(s => s.deadline).filter(Boolean)
                    });
                }
                
                // Safe Auto-Fixes
                if (hasTextErrors) {
                    updatedData = cleanObject(updatedData);
                    needsUpdate = true;
                }
                
                if (isOutdatedDate(data.application_deadline)) {
                    updatedData.application_deadline = updateDeadline(data.application_deadline);
                    updatedData.deadline_needs_review = true;
                    needsUpdate = true;
                }
                
                if (data.scholarships && Array.isArray(data.scholarships)) {
                    const hasOutdatedScholarships = data.scholarships.some(s => isOutdatedDate(s.deadline));
                    if (hasOutdatedScholarships) {
                        updatedData.scholarships = data.scholarships.map(scholarship => {
                            if (isOutdatedDate(scholarship.deadline)) {
                                return {
                                    ...scholarship,
                                    deadline: updateDeadline(scholarship.deadline)
                                };
                            }
                            return scholarship;
                        });
                        needsUpdate = true;
                    }
                }
                
                if (hasTextErrors || hasMissingFields || hasOutdatedDeadline) {
                    updatedData.data_quality_flags = {
                        has_text_errors: hasTextErrors,
                        has_missing_fields: hasMissingFields,
                        has_outdated_deadlines: hasOutdatedDeadline,
                        last_scan: new Date().toISOString()
                    };
                    needsUpdate = true;
                }
                
                // Update record if needed
                if (needsUpdate) {
                    await apiClient.entities.University.update(universityId, updatedData);
                    issues.fixed_records.push({
                        id: universityId,
                        name: data.name,
                        fixes_applied: {
                            cleaned_text: hasTextErrors,
                            updated_deadlines: hasOutdatedDeadline
                        }
                    });
                }
            }
            
            const result = {
                success: true,
                summary: {
                    total_scanned: universities.length,
                    issues_found: {
                        corrupted_text: issues.corrupted_text.length,
                        missing_fields: issues.missing_fields.length,
                        outdated_deadlines: issues.outdated_deadlines.length
                    },
                    records_fixed: issues.fixed_records.length
                },
                detailed_issues: issues
            };
            
            setScanResults(result);
            toast.success(`Scan complete! Fixed ${result.summary.records_fixed} records`, { id: 'scan' });
        } catch (error) {
            toast.error('Scan failed: ' + (error?.message ?? String(error)), { id: 'scan' });
            console.error('Scan error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleRemoveDuplicates = async () => {
        setIsRemovingDuplicates(true);
        setDuplicateResults(null);
        
        try {
            toast.loading('Detecting duplicates...', { id: 'duplicates' });
            
            // Fetch all universities
            const universities = await apiClient.entities.University.list(null, 5000);
            
            // Group by name (case-insensitive)
            const nameGroups = {};
            universities.forEach(uni => {
                if (!uni.name || typeof uni.name !== 'string') return;
                const normalizedName = uni.name.toLowerCase().trim();
                if (!nameGroups[normalizedName]) {
                    nameGroups[normalizedName] = [];
                }
                nameGroups[normalizedName].push(uni);
            });
            
            // Find duplicates
            const duplicateGroups = Object.entries(nameGroups)
                .filter(([_, unis]) => unis.length > 1)
                .map(([name, unis]) => ({ name, universities: unis }));
            
            if (duplicateGroups.length === 0) {
                toast.success('No duplicates found!', { id: 'duplicates' });
                setDuplicateResults({
                    duplicates_found: 0,
                    records_removed: 0,
                    details: []
                });
                return;
            }
            
            // Score records based on completeness
            const scoreRecord = (uni) => {
                let score = 0;
                const fields = [
                    'description', 'website', 'ranking', 'acceptance_rate',
                    'notable_programs', 'campus_life', 'international_support',
                    'visa_info', 'scholarships', 'admission_requirements', 'contact_info'
                ];
                
                fields.forEach(field => {
                    const value = uni[field];
                    if (value !== null && value !== undefined && value !== '') {
                        if (Array.isArray(value) && value.length > 0) score += 2;
                        else if (typeof value === 'object' && Object.keys(value).length > 0) score += 3;
                        else score += 1;
                    }
                });
                
                // Bonus for realistic values. Both checks require a real value:
                // `null >= 0` is true in JavaScript, so an unguarded tuition
                // comparison awards this point to rows that publish no tuition at
                // all — credit for absent data. The guard mirrors the
                // null/undefined/'' shape used by the `fields.forEach` loop above,
                // so a missing value earns nothing.
                //
                // Behaviour change, stated rather than left silent. When
                // `living_cost_estimate` was a fabricated 8000 it fell inside the
                // 3000-25000 band and earned this point; it is now a real null, so
                // it earns nothing, and every US row lost that point. That loss
                // silently changed which duplicate row was kept and which were
                // deleted. The direction is the intended one — a row publishing no
                // cost data should rank lower and be likelier to be the one
                // removed — but it is a change, so it is written down here instead
                // of left in the diff's wake.
                if (uni.tuition_min !== null && uni.tuition_min !== undefined && uni.tuition_min !== '' &&
                    uni.tuition_min >= 0 && uni.tuition_min <= 50000) score += 1;
                if (uni.living_cost_estimate !== null && uni.living_cost_estimate !== undefined && uni.living_cost_estimate !== '' &&
                    uni.living_cost_estimate >= 3000 && uni.living_cost_estimate <= 25000) score += 1;
                
                return score;
            };
            
            const results = [];
            let totalRemoved = 0;
            
            // Process each duplicate group
            for (const group of duplicateGroups) {
                const scored = group.universities.map(uni => ({
                    ...uni,
                    score: scoreRecord(uni)
                }));
                
                // Sort by score (highest first), with an explicit tiebreak so the
                // keep/delete decision is deterministic. `Array.prototype.sort` is
                // stable in modern engines, which means ties were previously broken
                // by whatever order the API returned rows in — the same input could
                // keep a different row after a re-fetch, and this function deletes
                // the losers. The tiebreak compares ids as strings by code unit
                // (`<`/`>`, not `localeCompare`, whose ordering depends on the
                // runtime's ICU data), so the comparison is a total order and does
                // not vary by environment. It keeps the lowest id, so the winner is
                // reproducible. Rows with no id at all still tie and fall back to
                // fetch order, which is the one case this cannot pin.
                scored.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    const idA = String(a.id);
                    const idB = String(b.id);
                    if (idA < idB) return -1;
                    if (idA > idB) return 1;
                    return 0;
                });
                
                // Keep the best one
                const toKeep = scored[0];
                const toDelete = scored.slice(1);
                
                // Delete duplicates
                for (const uni of toDelete) {
                    await apiClient.entities.University.delete(uni.id);
                    totalRemoved++;
                }
                
                results.push({
                    name: group.name,
                    total_found: group.universities.length,
                    kept: toKeep.id,
                    removed: toDelete.map(u => u.id)
                });
            }
            
            setDuplicateResults({
                duplicates_found: duplicateGroups.length,
                records_removed: totalRemoved,
                details: results
            });
            
            toast.success(`Removed ${totalRemoved} duplicate records!`, { id: 'duplicates' });
        } catch (error) {
            toast.error('Duplicate removal failed: ' + (error?.message ?? String(error)), { id: 'duplicates' });
            console.error('Duplicate removal error:', error);
        } finally {
            setIsRemovingDuplicates(false);
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-600">This page is for administrators only.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Data Quality Scanner</h1>
                    <p className="text-slate-600">
                        Scan the university database for corrupted text, missing fields, and outdated deadlines
                    </p>
                </div>

                {/* Scan Control */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-600" />
                            Database Scanner
                        </CardTitle>
                        <CardDescription>
                            This will scan all universities and perform safe auto-fixes on detected issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
                                    <p className="text-sm font-medium text-amber-900">Corrupted Text</p>
                                    <p className="text-xs text-amber-700 mt-1">Random symbols, encoding issues</p>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <FileWarning className="w-5 h-5 text-blue-600 mb-2" />
                                    <p className="text-sm font-medium text-blue-900">Missing Fields</p>
                                    <p className="text-xs text-blue-700 mt-1">Empty or null data</p>
                                </div>
                                <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                                    <Calendar className="w-5 h-5 text-violet-600 mb-2" />
                                    <p className="text-sm font-medium text-violet-900">Outdated Dates</p>
                                    <p className="text-xs text-violet-700 mt-1">Deadlines before 2026</p>
                                </div>
                            </div>

                            <Button 
                                onClick={handleScan} 
                                disabled={isScanning}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Scanning Database...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Start Scan & Fix
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {scanResults && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                Scan Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Summary */}
                            <div className="grid sm:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-slate-800">
                                        {scanResults.summary.total_scanned}
                                    </p>
                                    <p className="text-sm text-slate-600">Total Scanned</p>
                                </div>
                                <div className="text-center p-4 bg-amber-50 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-700">
                                        {scanResults.summary.issues_found.corrupted_text}
                                    </p>
                                    <p className="text-sm text-amber-700">Text Issues</p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-700">
                                        {scanResults.summary.issues_found.missing_fields}
                                    </p>
                                    <p className="text-sm text-blue-700">Missing Fields</p>
                                </div>
                                <div className="text-center p-4 bg-violet-50 rounded-lg">
                                    <p className="text-2xl font-bold text-violet-700">
                                        {scanResults.summary.issues_found.outdated_deadlines}
                                    </p>
                                    <p className="text-sm text-violet-700">Outdated Dates</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Fixed Records */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    Records Fixed: {scanResults.summary.records_fixed}
                                </h3>
                                
                                {scanResults.detailed_issues.fixed_records.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {scanResults.detailed_issues.fixed_records.map((record) => (
                                            <div 
                                                key={record.id} 
                                                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                                            >
                                                <p className="font-medium text-slate-800">{record.name}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {record.fixes_applied.cleaned_text && (
                                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                            Cleaned Text
                                                        </Badge>
                                                    )}
                                                    {record.fixes_applied.updated_deadlines && (
                                                        <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                                                            Updated Deadlines
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Alert>
                                        <AlertDescription>
                                            No issues found! Database is clean.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Detailed Issues */}
                            {scanResults.detailed_issues.corrupted_text.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                            Corrupted Text Issues
                                        </h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {scanResults.detailed_issues.corrupted_text.map((issue, idx) => (
                                                <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                                                    <p className="font-medium text-slate-800">{issue.name}</p>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        {issue.problems.length} corrupted field(s) detected
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {scanResults.detailed_issues.outdated_deadlines.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-violet-600" />
                                            Outdated Deadlines
                                        </h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {scanResults.detailed_issues.outdated_deadlines.map((issue, idx) => (
                                                <div key={idx} className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm">
                                                    <p className="font-medium text-slate-800">{issue.name}</p>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        Deadline: {issue.deadline || 'N/A'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            </CardContent>
                            </Card>
                            )}

                            {/* Duplicate Detection */}
                            <Card>
                            <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Duplicate Detection & Removal
                            </CardTitle>
                            <CardDescription>
                            Find and remove duplicate university records based on name matching
                            </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                            <Button 
                            onClick={handleRemoveDuplicates}
                            disabled={isRemovingDuplicates}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                            >
                            {isRemovingDuplicates ? (
                               <>
                                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                   Removing Duplicates...
                               </>
                            ) : (
                               <>
                                   <Users className="w-4 h-4 mr-2" />
                                   Detect & Remove Duplicates
                               </>
                            )}
                            </Button>

                            {duplicateResults && (
                            <div className="space-y-4 mt-6">
                               <div className="grid sm:grid-cols-2 gap-4">
                                   <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                                       <p className="text-sm text-amber-600 mb-1">Duplicate Groups Found</p>
                                       <p className="text-2xl font-bold text-amber-700">
                                           {duplicateResults.duplicates_found}
                                       </p>
                                   </div>
                                   <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                       <p className="text-sm text-red-600 mb-1">Records Removed</p>
                                       <p className="text-2xl font-bold text-red-700">
                                           {duplicateResults.records_removed}
                                       </p>
                                   </div>
                               </div>

                               {duplicateResults.details.length > 0 && (
                                   <div className="space-y-2">
                                       <h4 className="font-semibold text-slate-700">Removed Duplicates:</h4>
                                       <div className="max-h-64 overflow-y-auto space-y-2">
                                           {duplicateResults.details.map((item, idx) => (
                                               <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                   <p className="font-medium text-slate-800">{item.name}</p>
                                                   <p className="text-xs text-slate-500 mt-1">
                                                       Found {item.total_found} records • Kept 1 • Removed {item.removed.length}
                                                   </p>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}
                            </div>
                            )}
                            </CardContent>
                            </Card>
                            </div>
                            </div>
                            );
                            }