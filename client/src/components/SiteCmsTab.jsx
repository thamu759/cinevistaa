import { useState, useEffect } from 'react';
import {
  Layout, Globe, FileText, Plus, Edit, Trash2, Save, Eye,
  CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Sparkles,
  Sliders, Link2, Share2, Layers, Shield
} from 'lucide-react';
import {
  fetchSiteSettings, updateSiteSettings,
  fetchCmsPages, createCmsPage, updateCmsPage, deleteCmsPage
} from '../api';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { renderMarkdown } from './DynamicCmsPage';

export default function SiteCmsTab({ showSuccess, showToast }) {
  const [subTab, setSubTab] = useState('home'); // 'home' | 'pages' | 'footer'
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    announcement: {
      enabled: true,
      badge: 'TRENDING',
      text: '',
      link: ''
    },
    heroBanner: {
      enabled: true,
      badge: 'Cine Pulse',
      title: 'Pulse\nMovie Updates',
      subtitle: '',
      buttonText: 'Watch Pulse',
      buttonAction: 'cine-pulse',
      backdropUrl: ''
    },
    sections: {
      showStaffPicks: true,
      staffPicksTitle: "Staff Picks & Editor's Choice",
      showTrending: true,
      trendingTitle: 'Trending Now',
      showRecommended: true,
      recommendedTitle: 'Recommended For You',
      showGames: true,
      gamesTitle: 'Fun Activities'
    },
    footer: {
      tagline: '',
      copyright: '',
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      youtubeUrl: ''
    }
  });

  // Pages state
  const [pages, setPages] = useState([]);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState(null);
  const [confirmDeletePage, setConfirmDeletePage] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    content: '',
    showInNavbar: false,
    showInFooter: true,
    isPublished: true
  });

  useEffect(() => {
    loadSettings();
    loadPages();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSiteSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load site settings', 'error');
    }
    setLoading(false);
  };

  const loadPages = async () => {
    try {
      const data = await fetchCmsPages();
      if (Array.isArray(data)) setPages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateSiteSettings(settings);
      setSettings(updated);
      showSuccess('Site settings updated and live on website!');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    }
    setIsSaving(false);
  };

  const handleOpenCreatePage = () => {
    setEditingPageId(null);
    setPreviewMode(false);
    setPageForm({
      title: '',
      slug: '',
      subtitle: '',
      content: '## New Section\nWrite your page content here in Markdown format.\n\n- Feature 1\n- Feature 2\n\nContact us for more details.',
      showInNavbar: false,
      showInFooter: true,
      isPublished: true
    });
    setIsPageModalOpen(true);
  };

  const handleOpenEditPage = (page) => {
    setEditingPageId(page.id);
    setPreviewMode(false);
    setPageForm({
      title: page.title || '',
      slug: page.slug || '',
      subtitle: page.subtitle || '',
      content: page.content || '',
      showInNavbar: Boolean(page.showInNavbar),
      showInFooter: Boolean(page.showInFooter),
      isPublished: page.isPublished !== false
    });
    setIsPageModalOpen(true);
  };

  const handlePageFormSubmit = async (e) => {
    e.preventDefault();
    if (!pageForm.title.trim()) {
      showToast('Page title is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPageId) {
        await updateCmsPage(editingPageId, pageForm);
        showSuccess(`Page "${pageForm.title}" updated successfully!`);
      } else {
        await createCmsPage(pageForm);
        showSuccess(`Page "${pageForm.title}" created successfully!`);
      }
      setIsPageModalOpen(false);
      loadPages();
    } catch (err) {
      showToast(err.message || 'Error saving page', 'error');
    }
    setIsSaving(false);
  };

  const handleDeletePageConfirm = async () => {
    if (!confirmDeletePage) return;
    try {
      await deleteCmsPage(confirmDeletePage);
      showSuccess('Page deleted successfully');
      setConfirmDeletePage(null);
      loadPages();
    } catch (err) {
      showToast(err.message || 'Error deleting page', 'error');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layout size={20} style={{ color: 'var(--color-accent-gold)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Site CMS & Page Control</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Live control over homepage banners, announcements, sections, and custom pages without code changes.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {subTab === 'pages' && (
            <button className="btn-primary" onClick={handleOpenCreatePage} style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
              <Plus size={14} /> Add New Page
            </button>
          )}
          {(subTab === 'home' || subTab === 'footer') && (
            <button className="btn-primary" onClick={handleSaveSettings} disabled={isSaving} style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save & Publish'}
            </button>
          )}
        </div>
      </div>

      {/* SUB TABS */}
      <div className="cms-subtabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'home', label: 'Home Page & Announcements', icon: Sliders },
          { id: 'pages', label: 'Pages Manager', icon: FileText, count: pages.length },
          { id: 'footer', label: 'Footer & Socials', icon: Globe },
        ].map(t => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`cms-subtab-btn ${isActive ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
                color: isActive ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} />
              {t.label}
              {t.count !== undefined && (
                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '10px', background: isActive ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.1)', color: isActive ? '#000' : 'inherit', fontWeight: 700 }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: HOME PAGE & ANNOUNCEMENT ─── */}
      {subTab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 1. TOP ANNOUNCEMENT BAR */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--color-accent-gold)' }} />
                  Top Announcement Bar (Site Header)
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Displays a prominent alert banner at the very top of the website.
                </p>
              </div>
              <label className="cms-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.announcement?.enabled || false}
                  onChange={e => setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, enabled: e.target.checked }
                  })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-gold)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: settings.announcement?.enabled ? 'var(--color-accent-gold)' : 'var(--color-text-muted)' }}>
                  {settings.announcement?.enabled ? 'Active (Live)' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* LIVE PREVIEW BAR */}
            {settings.announcement?.enabled && (
              <div style={{
                background: 'linear-gradient(90deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.22) 100%)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--color-accent-gold)',
                  color: '#000',
                  letterSpacing: '0.05em'
                }}>
                  {settings.announcement?.badge || 'ALERT'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {settings.announcement?.text || 'Type your announcement message below...'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gold)', fontWeight: 600 }}>
                  Preview
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Badge Label</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcement?.badge || ''}
                  placeholder="e.g. TRENDING, BREAKING, NEW"
                  onChange={e => setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, badge: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Link (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcement?.link || ''}
                  placeholder="e.g. /new-releases or /articles"
                  onChange={e => setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, link: e.target.value }
                  })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Announcement Message</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcement?.text || ''}
                  placeholder="e.g. Leo, Goat & Manjummel Boys reviews are trending! Check out our curated critique."
                  onChange={e => setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, text: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* 2. HERO PROMOTIONAL BANNER */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} style={{ color: 'var(--color-accent-gold)' }} />
                  Home Hero Promotional Slide
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  The featured lead slide on the homepage hero carousel.
                </p>
              </div>
              <label className="cms-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.heroBanner?.enabled !== false}
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, enabled: e.target.checked }
                  })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-gold)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: settings.heroBanner?.enabled !== false ? 'var(--color-accent-gold)' : 'var(--color-text-muted)' }}>
                  {settings.heroBanner?.enabled !== false ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Badge Tag</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.heroBanner?.badge || ''}
                  placeholder="e.g. Cine Pulse"
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, badge: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Button Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.heroBanner?.buttonText || ''}
                  placeholder="e.g. Watch Pulse"
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, buttonText: e.target.value }
                  })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Headline Title (Use \n or new lines for break)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.heroBanner?.title || ''}
                  placeholder="Pulse&#10;Movie Updates"
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, title: e.target.value }
                  })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Subtitle Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.heroBanner?.subtitle || ''}
                  placeholder="Swipe through the latest cinema news, rumors, and breaking updates — pulse style!"
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, subtitle: e.target.value }
                  })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Custom Backdrop Image URL (Optional - leave blank to use Cine Pulse poster)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.heroBanner?.backdropUrl || ''}
                  placeholder="https://images.unsplash.com/photo-..."
                  onChange={e => setSettings({
                    ...settings,
                    heroBanner: { ...settings.heroBanner, backdropUrl: e.target.value }
                  })}
                />
                {settings.heroBanner?.backdropUrl && (
                  <div style={{ marginTop: '0.5rem', width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', backgroundImage: `url(${settings.heroBanner.backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
              </div>
            </div>
          </div>

          {/* 3. SECTION VISIBILITY & TITLES */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={16} style={{ color: 'var(--color-accent-gold)' }} />
              Homepage Sections Visibility & Custom Headings
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Enable or disable sections on the homepage and customize their display headings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'StaffPicks', label: 'Staff Picks / Featured Pick', defTitle: "Staff Picks & Editor's Choice" },
                { key: 'Trending', label: 'Trending Movies Row', defTitle: 'Trending Now' },
                { key: 'Recommended', label: 'Recommended For You Row', defTitle: 'Recommended For You' },
                { key: 'Games', label: 'Fun Activities (Quiz, Wheel, Blind Frame, Mood Matcher)', defTitle: 'Fun Activities' }
              ].map(sec => {
                const showKey = `show${sec.key}`;
                const titleKey = `${sec.key.charAt(0).toLowerCase() + sec.key.slice(1)}Title`;
                const isEnabled = settings.sections?.[showKey] !== false;

                return (
                  <div key={sec.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minWidth: '220px' }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={e => setSettings({
                          ...settings,
                          sections: { ...settings.sections, [showKey]: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent-gold)' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sec.label}</span>
                    </label>

                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Title:</span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                        disabled={!isEnabled}
                        value={settings.sections?.[titleKey] || ''}
                        placeholder={sec.defTitle}
                        onChange={e => setSettings({
                          ...settings,
                          sections: { ...settings.sections, [titleKey]: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button className="btn-primary" onClick={handleSaveSettings} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save & Publish All Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PAGES MANAGER ─── */}
      {subTab === 'pages' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Manage static & custom content pages (e.g. About, Privacy, Critic Guidelines, Events). You can create new pages anytime.
            </p>
            <button className="btn-primary" onClick={handleOpenCreatePage} style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>
              <Plus size={14} /> Add New Page
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page Title & URL</th>
                  <th>Placement</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(p => (
                  <tr key={p.id || p.slug}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                        <Link2 size={11} /> /{p.slug}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {p.showInNavbar && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700 }}>
                            Navbar
                          </span>
                        )}
                        {p.showInFooter && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 700 }}>
                            Footer
                          </span>
                        )}
                        {!p.showInNavbar && !p.showInFooter && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                            Direct Link
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        background: p.isPublished !== false ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.isPublished !== false ? '#34d399' : '#ef4444'
                      }}>
                        {p.isPublished !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => handleOpenEditPage(p)}
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => setConfirmDeletePage(p.id || p.slug)}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FOOTER & SOCIALS ─── */}
      {subTab === 'footer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={16} style={{ color: 'var(--color-accent-gold)' }} />
              Footer Branding & Social Links
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Customize the footer description, copyright notice, and social media handles.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Brand Tagline</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.footer?.tagline || ''}
                  placeholder="Devoting the cinematic experience through curated storytelling..."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, tagline: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Copyright Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.footer?.copyright || ''}
                  placeholder="thiraipedia. All rights reserved."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, copyright: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Facebook URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.footer?.facebookUrl || ''}
                  placeholder="https://facebook.com/..."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, facebookUrl: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Instagram URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.footer?.instagramUrl || ''}
                  placeholder="https://instagram.com/..."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, instagramUrl: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Twitter / X URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.footer?.twitterUrl || ''}
                  placeholder="https://twitter.com/..."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, twitterUrl: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>YouTube URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.footer?.youtubeUrl || ''}
                  placeholder="https://youtube.com/@..."
                  onChange={e => setSettings({
                    ...settings,
                    footer: { ...settings.footer, youtubeUrl: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button className="btn-primary" onClick={handleSaveSettings} disabled={isSaving} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
              <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save & Publish Footer'}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT CMS PAGE ─── */}
      <Modal isOpen={isPageModalOpen} onClose={() => setIsPageModalOpen(false)} width="720px">
        <div style={{ padding: '0.5rem 0' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
            {editingPageId ? 'Edit Page' : 'Create New Page'}
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Configure page metadata, URL slug, and format body content using Markdown.
          </p>

          <form onSubmit={handlePageFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Page Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={pageForm.title}
                  placeholder="e.g. Cinema Awards 2026"
                  onChange={e => {
                    const title = e.target.value;
                    const autoSlug = editingPageId ? pageForm.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setPageForm({ ...pageForm, title, slug: autoSlug });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>URL Slug (/page/:slug)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={pageForm.slug}
                  placeholder="e.g. cinema-awards"
                  onChange={e => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Subtitle / Excerpt</label>
                <input
                  type="text"
                  className="form-input"
                  value={pageForm.subtitle}
                  placeholder="e.g. Celebrating the finest craft across Tamil and Malayalam cinema"
                  onChange={e => setPageForm({ ...pageForm, subtitle: e.target.value })}
                />
              </div>
            </div>

            {/* PLACEMENT & STATUS TOGGLES */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={pageForm.isPublished}
                  onChange={e => setPageForm({ ...pageForm, isPublished: e.target.checked })}
                  style={{ accentColor: 'var(--color-accent-gold)' }}
                />
                <span style={{ fontWeight: 600 }}>Published (Live)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={pageForm.showInNavbar}
                  onChange={e => setPageForm({ ...pageForm, showInNavbar: e.target.checked })}
                  style={{ accentColor: 'var(--color-accent-gold)' }}
                />
                <span>Show in Header Nav</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={pageForm.showInFooter}
                  onChange={e => setPageForm({ ...pageForm, showInFooter: e.target.checked })}
                  style={{ accentColor: 'var(--color-accent-gold)' }}
                />
                <span>Show in Footer Links</span>
              </label>
            </div>

            {/* CONTENT EDITOR WITH PREVIEW TOGGLE */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Page Body Content (Markdown Supported: ## Heading, - Bullets, **Bold**)
                </label>
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.15rem' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    style={{
                      border: 'none',
                      background: !previewMode ? 'var(--color-accent-gold)' : 'transparent',
                      color: !previewMode ? '#000' : 'var(--color-text-muted)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    style={{
                      border: 'none',
                      background: previewMode ? 'var(--color-accent-gold)' : 'transparent',
                      color: previewMode ? '#000' : 'var(--color-text-muted)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
              </div>

              {!previewMode ? (
                <textarea
                  className="form-input"
                  rows={10}
                  required
                  value={pageForm.content}
                  placeholder="## Section Heading&#10;&#10;Write detailed paragraph text here...&#10;&#10;- Key point 1&#10;- Key point 2"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}
                  onChange={e => setPageForm({ ...pageForm, content: e.target.value })}
                />
              ) : (
                <div style={{
                  minHeight: '220px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)'
                }}>
                  {renderMarkdown(pageForm.content) || (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nothing to preview.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsPageModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingPageId ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(confirmDeletePage)}
        onClose={() => setConfirmDeletePage(null)}
        onConfirm={handleDeletePageConfirm}
        title="Delete Page"
        message="Are you sure you want to permanently delete this CMS page? Links pointing to this page will no longer work."
        confirmLabel="Delete Page"
        danger
      />
    </div>
  );
}

