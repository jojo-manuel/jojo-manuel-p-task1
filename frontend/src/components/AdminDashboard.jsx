import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Shield, School, Phone, Mail, Hash, BookOpen } from 'lucide-react';

export default function AdminDashboard({ token }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
      } else {
        setError(data.message || 'Failed to fetch student directory');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.school && s.school.toLowerCase().includes(term)) ||
      (s.class && s.class.toLowerCase().includes(term)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in text-left text-slate-800">
      {/* Header Banner */}
      <div className="classic-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-admin">
                <Shield className="w-3.5 h-3.5 mr-1" /> Admin Directory
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Registration Database</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Manage and view registered student profiles, schools, classes, roll numbers, and contact details.
            </p>
          </div>

          <button
            onClick={fetchStudents}
            className="btn-secondary text-xs py-2 px-3.5 shrink-0 bg-white text-slate-800 border-white hover:bg-slate-100"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
          </button>
        </div>
      </div>

      {/* Directory Search Controls */}
      <div className="classic-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="classic-input pl-10 text-xs py-2.5"
            placeholder="Search name, school, roll #..."
          />
        </div>

        <div className="text-xs text-slate-600 font-bold">
          Total Registered Students: <span className="text-emerald-700 font-extrabold text-sm">{filteredStudents.length}</span>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="text-center py-12 classic-card rounded-3xl bg-white">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading student records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
          {error}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 classic-card rounded-3xl bg-white">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No Student Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="classic-card-interactive rounded-2xl p-5 relative flex flex-col justify-between bg-white border border-slate-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {student.name ? student.name.charAt(0).toUpperCase() : student.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                        {student.name || 'Unnamed Student'}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {student.email}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-student text-[9px] py-0 px-1.5">
                    ID #{student.id}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-bold">{student.school || 'School Not Provided'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                    <span className="flex items-center gap-1 text-[11px]">
                      <BookOpen className="w-3 h-3 text-indigo-600" /> Class: <strong className="text-slate-900">{student.class || 'N/A'}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Hash className="w-3 h-3 text-emerald-600" /> Roll: <strong className="text-emerald-700">{student.rollNumber || 'N/A'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-medium">{student.phone || 'Phone Not Provided'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Profile Status:</span>
                <span className={student.isProfileComplete ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {student.isProfileComplete ? 'Complete' : 'Incomplete Details'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
