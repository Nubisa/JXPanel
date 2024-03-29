

top_builddir=..
top_srcdir=..
srcdir=.

GLUE_MODULE_OBJS=mod_core.o mod_xfer.o mod_rlimit.o mod_auth_unix.o mod_auth_file.o mod_auth.o mod_ls.o mod_log.o mod_site.o mod_delay.o mod_facts.o mod_ident.o mod_auth_pam.o  mod_cap.o
LTDLINCL=
SHARED_CFLAGS=-DPR_SHARED_MODULE
SHARED_LDFLAGS=-avoid-version -export-dynamic -module


include ../Make.rules

.SUFFIXES: .la

.PHONY: ""

all:
	@echo "Running make from top level directory."
	cd .. && $(MAKE) all

Makefile: Makefile.in ../config.status
	cd ../ && ./config.status

# Special instructions for mod_dso, to include the libltdl headers
mod_dso.o: mod_dso.c
	$(CC) $(CPPFLAGS) $(LTDLINCL) $(CFLAGS) -c mod_dso.c

.c.o:
	$(CC) $(CPPFLAGS) $(CFLAGS) -c $<

.c.la:
	$(LIBTOOL) --mode=compile --tag=CC $(CC) $(CPPFLAGS) $(CFLAGS) $(SHARED_CFLAGS) -c $*.c
	$(LIBTOOL) --mode=link --tag=CC $(CC) -o $@ -rpath $(LIBEXECDIR) $(LDFLAGS) $(SHARED_LDFLAGS) $*.lo `cat $(top_srcdir)/modules/$*.c | grep '$$Libraries:' | sed -e 's/^.*\$$Libraries: \(.*\)\\$$/\1/'`

module_glue.c: module_glue.c.tmpl $(STATIC_MODULE_OBJS)
	srcdir=$(srcdir) $(srcdir)/glue.sh $(GLUE_MODULE_OBJS)

shared: $(SHARED_MODULE_OBJS)
	@dirs="$(SHARED_MODULE_DIRS)"; \
	for dir in $$dirs; do \
		(cd $(top_srcdir)/$$dir/ && $(MAKE) shared); \
	done

static: $(STATIC_MODULE_OBJS) module_glue.o
	@dirs="$(STATIC_MODULE_DIRS)"; \
	for dir in $$dirs; do \
		module=`echo "$$dir" | sed -e 's/^.*\///'`; \
		(cd $(top_srcdir)/$$dir/ && $(MAKE) static) && \
		cp $(top_srcdir)/$$dir/$$module.o .; \
	done

install:
	test -z "$(SHARED_MODULE_OBJS)" || $(LIBTOOL) --mode=install --tag=CC $(INSTALL_BIN) $(SHARED_MODULE_OBJS) $(DESTDIR)$(LIBEXECDIR)
	@dirs="$(SHARED_MODULE_DIRS) $(STATIC_MODULE_DIRS)"; \
	for dir in $$dirs; do \
		(cd $(top_srcdir)/$$dir/ && $(MAKE) install); \
	done

clean:
	$(RM) *.a *.o module_glue.c
	$(LIBTOOL) --mode=clean $(RM) $(SHARED_MODULE_OBJS)
	$(LIBTOOL) --mode=clean $(RM) `echo $(SHARED_MODULE_OBJS) | sed 's/\.la$\/.lo/g'`
	@dirs="$(SHARED_MODULE_DIRS) $(STATIC_MODULE_DIRS)"; \
	for dir in $$dirs; do \
		(cd $(top_srcdir)/$$dir/ && $(MAKE) clean); \
	done

depend:
	$(RM) module_glue.c
	makedepend $(CPPFLAGS) -Y *.c 2>/dev/null
	makedepend $(CPPFLAGS) -Y -fMakefile.in *.c 2>/dev/null
# DO NOT DELETE

mod_auth.o: ../include/conf.h ../include/version.h ../config.h
mod_auth.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_auth.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_auth.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_auth.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_auth.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_auth.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_auth.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_auth.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_auth.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_auth.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_auth.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_auth.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_auth.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_auth.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_auth.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_auth.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_auth.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_auth.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_auth.o: ../include/privs.h
mod_auth_file.o: ../include/conf.h ../include/version.h ../config.h
mod_auth_file.o: ../include/default_paths.h ../include/options.h
mod_auth_file.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_auth_file.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_auth_file.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_auth_file.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_auth_file.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_auth_file.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_auth_file.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_auth_file.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_auth_file.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_auth_file.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_auth_file.o: ../include/xferlog.h ../include/scoreboard.h
mod_auth_file.o: ../include/data.h ../include/display.h ../include/libsupp.h
mod_auth_file.o: ../include/glibc-glob.h ../include/fsio.h
mod_auth_file.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_auth_file.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_auth_file.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_auth_file.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_auth_file.o: ../include/pr-syslog.h ../include/memcache.h
mod_auth_file.o: ../include/tpl.h ../include/privs.h
mod_auth_pam.o: ../include/conf.h ../include/version.h ../config.h
mod_auth_pam.o: ../include/default_paths.h ../include/options.h
mod_auth_pam.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_auth_pam.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_auth_pam.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_auth_pam.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_auth_pam.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_auth_pam.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_auth_pam.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_auth_pam.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_auth_pam.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_auth_pam.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_auth_pam.o: ../include/xferlog.h ../include/scoreboard.h
mod_auth_pam.o: ../include/data.h ../include/display.h ../include/libsupp.h
mod_auth_pam.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_auth_pam.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_auth_pam.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_auth_pam.o: ../include/encode.h ../include/compat.h
mod_auth_pam.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_auth_pam.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_auth_pam.o: ../include/privs.h
mod_auth_unix.o: ../include/conf.h ../include/version.h ../config.h
mod_auth_unix.o: ../include/default_paths.h ../include/options.h
mod_auth_unix.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_auth_unix.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_auth_unix.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_auth_unix.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_auth_unix.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_auth_unix.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_auth_unix.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_auth_unix.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_auth_unix.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_auth_unix.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_auth_unix.o: ../include/xferlog.h ../include/scoreboard.h
mod_auth_unix.o: ../include/data.h ../include/display.h ../include/libsupp.h
mod_auth_unix.o: ../include/glibc-glob.h ../include/fsio.h
mod_auth_unix.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_auth_unix.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_auth_unix.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_auth_unix.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_auth_unix.o: ../include/pr-syslog.h ../include/memcache.h
mod_auth_unix.o: ../include/tpl.h ../include/privs.h
mod_cap.o: ../lib/libcap/include/sys/capability.h ../include/conf.h
mod_cap.o: ../include/version.h ../config.h ../include/default_paths.h
mod_cap.o: ../include/options.h ../include/pool.h ../include/str.h
mod_cap.o: ../include/ascii.h ../include/table.h ../include/proftpd.h
mod_cap.o: ../include/class.h ../include/netacl.h ../include/support.h
mod_cap.o: ../include/sets.h ../include/dirtree.h ../include/expr.h
mod_cap.o: ../include/rlimit.h ../include/filter.h ../include/modules.h
mod_cap.o: ../include/netio.h ../include/regexp.h ../include/stash.h
mod_cap.o: ../include/auth.h ../include/response.h ../include/timers.h
mod_cap.o: ../include/inet.h ../include/child.h ../include/netaddr.h
mod_cap.o: ../include/cmd.h ../include/bindings.h ../include/help.h
mod_cap.o: ../include/feat.h ../include/ftp.h ../include/log.h
mod_cap.o: ../include/parser.h ../include/xferlog.h ../include/scoreboard.h
mod_cap.o: ../include/data.h ../include/display.h ../include/libsupp.h
mod_cap.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_cap.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_cap.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_cap.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_cap.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_cap.o: ../include/memcache.h ../include/tpl.h ../include/privs.h
mod_core.o: ../include/conf.h ../include/version.h ../config.h
mod_core.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_core.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_core.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_core.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_core.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_core.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_core.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_core.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_core.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_core.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_core.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_core.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_core.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_core.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_core.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_core.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_core.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_core.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_core.o: ../include/privs.h
mod_ctrls.o: ../include/conf.h ../include/version.h ../config.h
mod_ctrls.o: ../include/default_paths.h ../include/options.h
mod_ctrls.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_ctrls.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_ctrls.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_ctrls.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_ctrls.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_ctrls.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_ctrls.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_ctrls.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_ctrls.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_ctrls.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_ctrls.o: ../include/xferlog.h ../include/scoreboard.h ../include/data.h
mod_ctrls.o: ../include/display.h ../include/libsupp.h
mod_ctrls.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_ctrls.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_ctrls.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_ctrls.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_ctrls.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_ctrls.o: ../include/memcache.h ../include/tpl.h ../include/privs.h
mod_ctrls.o: ../include/mod_ctrls.h
mod_delay.o: ../include/conf.h ../include/version.h ../config.h
mod_delay.o: ../include/default_paths.h ../include/options.h
mod_delay.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_delay.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_delay.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_delay.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_delay.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_delay.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_delay.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_delay.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_delay.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_delay.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_delay.o: ../include/xferlog.h ../include/scoreboard.h ../include/data.h
mod_delay.o: ../include/display.h ../include/libsupp.h
mod_delay.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_delay.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_delay.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_delay.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_delay.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_delay.o: ../include/memcache.h ../include/tpl.h ../include/privs.h
mod_dso.o: ../include/conf.h ../include/version.h ../config.h
mod_dso.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_dso.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_dso.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_dso.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_dso.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_dso.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_dso.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_dso.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_dso.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_dso.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_dso.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_dso.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_dso.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_dso.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_dso.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_dso.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_dso.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_dso.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_dso.o: ../include/mod_ctrls.h ../lib/libltdl/ltdl.h
mod_facl.o: ../include/conf.h ../include/version.h ../config.h
mod_facl.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_facl.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_facl.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_facl.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_facl.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_facl.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_facl.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_facl.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_facl.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_facl.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_facl.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_facl.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_facl.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_facl.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_facl.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_facl.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_facl.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_facl.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_facts.o: ../include/conf.h ../include/version.h ../config.h
mod_facts.o: ../include/default_paths.h ../include/options.h
mod_facts.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_facts.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_facts.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_facts.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_facts.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_facts.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_facts.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_facts.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_facts.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_facts.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_facts.o: ../include/xferlog.h ../include/scoreboard.h ../include/data.h
mod_facts.o: ../include/display.h ../include/libsupp.h
mod_facts.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_facts.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_facts.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_facts.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_facts.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_facts.o: ../include/memcache.h ../include/tpl.h ../include/privs.h
mod_ident.o: ../include/conf.h ../include/version.h ../config.h
mod_ident.o: ../include/default_paths.h ../include/options.h
mod_ident.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_ident.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_ident.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_ident.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_ident.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_ident.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_ident.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_ident.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_ident.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_ident.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_ident.o: ../include/xferlog.h ../include/scoreboard.h ../include/data.h
mod_ident.o: ../include/display.h ../include/libsupp.h
mod_ident.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_ident.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_ident.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_ident.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_ident.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_ident.o: ../include/memcache.h ../include/tpl.h
mod_lang.o: ../include/conf.h ../include/version.h ../config.h
mod_lang.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_lang.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_lang.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_lang.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_lang.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_lang.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_lang.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_lang.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_lang.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_lang.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_lang.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_lang.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_lang.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_lang.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_lang.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_lang.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_lang.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_lang.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_log.o: ../include/conf.h ../include/version.h ../config.h
mod_log.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_log.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_log.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_log.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_log.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_log.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_log.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_log.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_log.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_log.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_log.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_log.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_log.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_log.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_log.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_log.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_log.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_log.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_log.o: ../include/privs.h ../include/mod_log.h
mod_ls.o: ../include/conf.h ../include/version.h ../config.h
mod_ls.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_ls.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_ls.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_ls.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_ls.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_ls.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_ls.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_ls.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_ls.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_ls.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_ls.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_ls.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_ls.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_ls.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_ls.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_ls.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_ls.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_ls.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_memcache.o: ../include/conf.h ../include/version.h ../config.h
mod_memcache.o: ../include/default_paths.h ../include/options.h
mod_memcache.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_memcache.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_memcache.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_memcache.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_memcache.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_memcache.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_memcache.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_memcache.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_memcache.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_memcache.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_memcache.o: ../include/xferlog.h ../include/scoreboard.h
mod_memcache.o: ../include/data.h ../include/display.h ../include/libsupp.h
mod_memcache.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_memcache.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_memcache.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_memcache.o: ../include/encode.h ../include/compat.h
mod_memcache.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_memcache.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_memcache.o: ../include/privs.h
mod_rlimit.o: ../include/conf.h ../include/version.h ../config.h
mod_rlimit.o: ../include/default_paths.h ../include/options.h
mod_rlimit.o: ../include/pool.h ../include/str.h ../include/ascii.h
mod_rlimit.o: ../include/table.h ../include/proftpd.h ../include/class.h
mod_rlimit.o: ../include/netacl.h ../include/support.h ../include/sets.h
mod_rlimit.o: ../include/dirtree.h ../include/expr.h ../include/rlimit.h
mod_rlimit.o: ../include/filter.h ../include/modules.h ../include/netio.h
mod_rlimit.o: ../include/regexp.h ../include/stash.h ../include/auth.h
mod_rlimit.o: ../include/response.h ../include/timers.h ../include/inet.h
mod_rlimit.o: ../include/child.h ../include/netaddr.h ../include/cmd.h
mod_rlimit.o: ../include/bindings.h ../include/help.h ../include/feat.h
mod_rlimit.o: ../include/ftp.h ../include/log.h ../include/parser.h
mod_rlimit.o: ../include/xferlog.h ../include/scoreboard.h ../include/data.h
mod_rlimit.o: ../include/display.h ../include/libsupp.h
mod_rlimit.o: ../include/glibc-glob.h ../include/fsio.h ../include/mkhome.h
mod_rlimit.o: ../include/ctrls.h ../include/session.h ../include/event.h
mod_rlimit.o: ../include/var.h ../include/throttle.h ../include/trace.h
mod_rlimit.o: ../include/encode.h ../include/compat.h ../include/proctitle.h
mod_rlimit.o: ../include/pidfile.h ../include/env.h ../include/pr-syslog.h
mod_rlimit.o: ../include/memcache.h ../include/tpl.h ../include/privs.h
mod_site.o: ../include/conf.h ../include/version.h ../config.h
mod_site.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_site.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_site.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_site.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_site.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_site.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_site.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_site.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_site.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_site.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_site.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_site.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_site.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_site.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_site.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_site.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_site.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_site.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_xfer.o: ../include/conf.h ../include/version.h ../config.h
mod_xfer.o: ../include/default_paths.h ../include/options.h ../include/pool.h
mod_xfer.o: ../include/str.h ../include/ascii.h ../include/table.h
mod_xfer.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
mod_xfer.o: ../include/support.h ../include/sets.h ../include/dirtree.h
mod_xfer.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
mod_xfer.o: ../include/modules.h ../include/netio.h ../include/regexp.h
mod_xfer.o: ../include/stash.h ../include/auth.h ../include/response.h
mod_xfer.o: ../include/timers.h ../include/inet.h ../include/child.h
mod_xfer.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
mod_xfer.o: ../include/help.h ../include/feat.h ../include/ftp.h
mod_xfer.o: ../include/log.h ../include/parser.h ../include/xferlog.h
mod_xfer.o: ../include/scoreboard.h ../include/data.h ../include/display.h
mod_xfer.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
mod_xfer.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
mod_xfer.o: ../include/event.h ../include/var.h ../include/throttle.h
mod_xfer.o: ../include/trace.h ../include/encode.h ../include/compat.h
mod_xfer.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
mod_xfer.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
mod_xfer.o: ../include/privs.h
