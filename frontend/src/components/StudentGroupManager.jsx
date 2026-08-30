import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  PlusCircle,
  Mail,
  CheckCircle,
  Clock,
  School,
  GraduationCap,
  Sparkles,
  X,
  Send,
  AlertCircle,
  Hash,
  Award,
  ArrowLeft,
  Trash2,
  UserMinus
} from 'lucide-react';
import { useToast } from './Toast';
import { LoadingSpinner, ButtonSpinner, SkeletonList } from './LoadingSpinner';
import { getAnchoredStyle } from './AnchoredPopover';

export default function StudentGroupManager({ user, token, onGroupUpdated }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupProgress, setGroupProgress] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createAnchorRect, setCreateAnchorRect] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStudentId, setInviteStudentId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  useEffect(() => {
    fetchMyGroups();
  }, [token]);

  useEffect(() => {
    if (selectedGroup?.progress) {
      setGroupProgress(selectedGroup.progress);
    }
    if (selectedGroup?.id) {
      fetchGroupProgress(selectedGroup.id);
    } else {
      setGroupProgress(null);
    }
  }, [selectedGroup?.id, selectedGroup?.progress, token]);

  const fetchGroupProgress = async (groupId) => {
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        const match = data.groups.find((g) => String(g.id) === String(groupId));
        if (match && match.progress) {
          setGroupProgress(match.progress);
        }
      }
    } catch (err) {
      console.error('Error fetching group progress:', err);
    }
  };

  const fetchMyGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          const keep = selectedGroup
            ? data.groups.find((g) => g.id === selectedGroup.id)
            : null;
          setSelectedGroup(keep || data.groups[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.students) {
        setSearchResults(data.students.filter((s) => s.id !== user.id));
      }
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName, description: groupDesc })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      const createdGroupName = groupName.trim();
      setGroupName('');
      setGroupDesc('');
      setIsCreateModalOpen(false);
      await fetchMyGroups();
      if (data.group) setSelectedGroup(data.group);
      if (onGroupUpdated) onGroupUpdated();
      toast.success(`Study group "${createdGroupName}" created successfully!`);
    } catch (err) {
      setCreateError(err.message);
      toast.error(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleSendInvite = async (targetEmail, targetUserId = null, targetStudentId = null) => {
    if (!selectedGroup) {
      setInviteError('Please select a group first');
      toast.warning('Please select a group first');
      return;
    }

    setInviting(true);
    setInviteSuccess(null);
    setInviteError(null);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: targetEmail || undefined,
          userId: targetUserId || undefined,
          studentId: targetStudentId || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to invite student');
      }

      setInviteSuccess(data.message);
      toast.success(data.message || 'Invitation sent successfully!');
      setInviteEmail('');
      setInviteStudentId('');
      await fetchMyGroups();
      const groupRes = await fetch(`/api/groups/${selectedGroup.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const groupData = await groupRes.json();
      if (groupRes.ok && groupData.group) {
        setSelectedGroup(groupData.group);
      }
    } catch (err) {
      setInviteError(err.message);
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!selectedGroup) return;
    const isSelf = String(memberUserId) === String(user?.id);
    const confirmMsg = isSelf
      ? `Are you sure you want to leave "${selectedGroup.name}"?`
      : `Are you sure you want to remove ${memberName || 'this student'} from "${selectedGroup.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setRemovingMemberId(memberUserId);
    try {
      let res = await fetch(`/api/groups/${selectedGroup.id}/members/${memberUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fallback in case DELETE was not routed
      if (res.status === 404) {
        res = await fetch(`/api/groups/${selectedGroup.id}/remove-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId: memberUserId })
        });
      }

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || (isSelf ? 'You left the group.' : 'Student removed from group.'));
        if (data.members) {
          setSelectedGroup((prev) => (prev ? { ...prev, members: data.members } : null));
        }
        await fetchMyGroups();
        if (onGroupUpdated) onGroupUpdated();
      } else {
        toast.error(data.message || 'Failed to remove member.');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Failed to remove member from group. Please try again.');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="w-full space-y-6 text-left animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Groups</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create a group and invite classmates by email or roll number.
          </p>
        </div>
        <button
          onClick={(e) => {
            setCreateAnchorRect(e.currentTarget.getBoundingClientRect());
            setIsCreateModalOpen(true);
          }}
          className="btn-primary text-sm py-2.5 px-4 w-full sm:w-auto min-h-11"
        >
          <PlusCircle className="w-4 h-4" /> New group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        <div className="md:col-span-5 space-y-5 sm:space-y-6">
          <div className="classic-card p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" /> Find Students
              </h3>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchStudents(e.target.value)}
                placeholder="Search by roll number, name, or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {searching ? (
              <LoadingSpinner size="sm" text="Searching student directory..." className="py-4" />
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {student.name || 'Unnamed Student'}
                        </span>
                        {student.rollNumber && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            #{student.rollNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{student.email}</p>
                    </div>
                    <button
                      onClick={() => handleSendInvite(student.email, student.id)}
                      disabled={!selectedGroup || inviting}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 disabled:opacity-50 min-h-10"
                    >
                      {inviting ? <ButtonSpinner className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>Invite</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-xs text-slate-400">No students matched "{searchQuery}"</div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Type a roll number, student ID, or name to search the portal.
              </p>
            )}
          </div>

          <div className="classic-card p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4 h-4 text-indigo-600" /> My Groups ({groups.length})
            </h3>
            {loadingGroups ? (
              <div className="space-y-3 py-2">
                <LoadingSpinner size="sm" text="Syncing study groups..." />
                <SkeletonList rows={3} />
              </div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No groups yet</p>
                <p className="text-[11px] text-slate-400">Create a group or accept an invitation from Notifications.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {groups.map((group) => {
                  const isSelected = selectedGroup && selectedGroup.id === group.id;
                  const isCreator = group.created_by === user.id || group.user_role === 'creator';
                  const isPending = group.user_status === 'pending';
                  return (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50/70 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{group.name}</h4>
                        {isCreator ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Creator</span>
                        ) : isPending ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Member</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" /> {group.members?.length || 1} members
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 space-y-6">
          {selectedGroup ? (
            <div className="classic-card p-4 sm:p-5 space-y-5">
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 break-anywhere">{selectedGroup.name}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0">#{String(selectedGroup.id).slice(-6)}</span>
                </div>
                {selectedGroup.description && (
                  <p className="text-sm text-slate-500 mt-1">{selectedGroup.description}</p>
                )}
              </div>

              {groupProgress && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" /> Group completion
                    </h4>
                    <span className={`text-xs font-extrabold ${groupProgress.overallPercent === 100 ? 'text-emerald-700' : 'text-indigo-700'}`}>
                      {groupProgress.overallPercent}%
                      {groupProgress.overallPercent === 100 ? ' · Complete badge' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${groupProgress.overallPercent || 0}%` }}
                      className={`h-full rounded-full ${groupProgress.overallPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {groupProgress.completeCount || 0} of {groupProgress.assignmentCount || 0} assignments fully confirmed by the group.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" /> Invite by email or student ID
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendInvite(inviteEmail.trim() || undefined, null, inviteStudentId.trim() || undefined);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 font-medium"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={inviteStudentId}
                        onChange={(e) => setInviteStudentId(e.target.value)}
                        placeholder="Roll no. or user ID"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={inviting || (!inviteEmail.trim() && !inviteStudentId.trim())}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 min-h-11"
                    >
                      <Send className="w-3.5 h-3.5" /> Invite
                    </button>
                  </div>
                </form>
                {inviteSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{inviteSuccess}</span>
                  </div>
                )}
                {inviteError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Members
                  </h4>
                  <span className="text-xs font-bold text-slate-500">{selectedGroup.members?.length || 0}</span>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedGroup.members && selectedGroup.members.length > 0 ? (
                    selectedGroup.members.map((member) => {
                      const isCurrentUserCreator = String(selectedGroup.creator_id) === String(user?.id) || selectedGroup.members?.some((m) => String(m.user_id) === String(user?.id) && (m.role === 'creator' || m.role === 'leader'));
                      const isThisMemberSelf = String(member.user_id) === String(user?.id);
                      const isMemberCreator = member.role === 'creator' || String(member.user_id) === String(selectedGroup.creator_id);
                      const isRemovingThis = removingMemberId === member.user_id;

                      return (
                        <div key={member.id} className="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-extrabold text-slate-900 truncate">
                                {member.user_name || member.user_email}
                              </h5>
                              {isThisMemberSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  You
                                </span>
                              )}
                              {member.roll_number && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  ID #{member.roll_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{member.user_email}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isMemberCreator ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Creator
                              </span>
                            ) : member.status === 'accepted' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}

                            {/* Remove Member Option for Group Creator */}
                            {isCurrentUserCreator && !isMemberCreator && (
                              <button
                                type="button"
                                disabled={isRemovingThis}
                                onClick={() => handleRemoveMember(member.user_id, member.user_name || member.user_email)}
                                className="p-1 sm:px-2.5 sm:py-1 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={`Remove ${member.user_name || member.user_email} from group`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {isRemovingThis ? 'Removing...' : 'Remove'}
                                </span>
                              </button>
                            )}

                            {/* Leave Group Option for Non-Creator Self */}
                            {isThisMemberSelf && !isMemberCreator && (
                              <button
                                type="button"
                                disabled={isRemovingThis}
                                onClick={() => handleRemoveMember(member.user_id, member.user_name || member.user_email)}
                                className="p-1 sm:px-2.5 sm:py-1 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Leave this study group"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {isRemovingThis ? 'Leaving...' : 'Leave Group'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">No members listed yet.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="classic-card p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Select a group</h3>
              <p className="text-xs text-slate-400">Create a group or pick one on the left to invite students.</p>
            </div>
          )}
        </div>
      </div>
      {/* Create Group Modal - Floating Card */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-[4px] flex items-start justify-center pt-3 sm:pt-6 px-3 sm:px-4 overflow-y-auto animate-fade-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/30 flex flex-col overflow-hidden text-left w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-0"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Sticky Fixed Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Go Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>Create New Study Group</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Group Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Physics Lab Group A"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description & Goals (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="Describe study topic or project objectives..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Floating Sticky Footer */}
              <div className="p-4 sm:p-5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white min-h-11 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back / Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !groupName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-11 cursor-pointer"
                >
                  {creating ? (
                    <>
                      <ButtonSpinner className="w-3.5 h-3.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
