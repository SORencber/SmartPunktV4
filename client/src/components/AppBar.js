import NotificationBell from './NotificationBell';

<Box sx={{ display: 'flex', alignItems: 'center' }}>
  <LanguageSelector />
  <NotificationBell />
  <IconButton
    size="large"
    edge="end"
    color="inherit"
    aria-label="account of current user"
    aria-controls="menu-appbar"
    aria-haspopup="true"
    onClick={handleMenu}
  >
    <AccountCircle />
  </IconButton>
</Box> 