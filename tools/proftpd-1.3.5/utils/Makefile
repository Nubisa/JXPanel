CC=gcc


top_srcdir=..
srcdir=.


include ../Make.rules


all:
	@echo "Running make from top level directory."
	cd ../; $(MAKE) all

Makefile: Makefile.in ../config.status
	cd ../ && ./config.status


.c.o:
	$(CC) $(CPPFLAGS) $(CFLAGS) -c $<

utils: $(FTPCOUNT_OBJS) $(FTPSCRUB_OBJS) $(FTPSHUT_OBJS) $(FTPTOP_OBJS) $(FTPWHO_OBJS)

clean:
	rm -f *.o

depend:
	makedepend $(CPPFLAGS) -Y *.c 2>/dev/null
	makedepend $(CPPFLAGS) -Y -fMakefile.in *.c 2>/dev/null
# DO NOT DELETE

ftpcount.o: utils.h ../config.h ../include/version.h ../include/options.h
ftpcount.o: ../include/ascii.h ../include/default_paths.h
ftpscrub.o: utils.h ../config.h ../include/version.h ../include/options.h
ftpscrub.o: ../include/ascii.h ../include/default_paths.h
ftpshut.o: ../include/conf.h ../include/version.h ../config.h
ftpshut.o: ../include/default_paths.h ../include/options.h ../include/pool.h
ftpshut.o: ../include/str.h ../include/ascii.h ../include/table.h
ftpshut.o: ../include/proftpd.h ../include/class.h ../include/netacl.h
ftpshut.o: ../include/support.h ../include/sets.h ../include/dirtree.h
ftpshut.o: ../include/expr.h ../include/rlimit.h ../include/filter.h
ftpshut.o: ../include/modules.h ../include/netio.h ../include/regexp.h
ftpshut.o: ../include/stash.h ../include/auth.h ../include/response.h
ftpshut.o: ../include/timers.h ../include/inet.h ../include/child.h
ftpshut.o: ../include/netaddr.h ../include/cmd.h ../include/bindings.h
ftpshut.o: ../include/help.h ../include/feat.h ../include/ftp.h
ftpshut.o: ../include/log.h ../include/parser.h ../include/xferlog.h
ftpshut.o: ../include/scoreboard.h ../include/data.h ../include/display.h
ftpshut.o: ../include/libsupp.h ../include/glibc-glob.h ../include/fsio.h
ftpshut.o: ../include/mkhome.h ../include/ctrls.h ../include/session.h
ftpshut.o: ../include/event.h ../include/var.h ../include/throttle.h
ftpshut.o: ../include/trace.h ../include/encode.h ../include/compat.h
ftpshut.o: ../include/proctitle.h ../include/pidfile.h ../include/env.h
ftpshut.o: ../include/pr-syslog.h ../include/memcache.h ../include/tpl.h
ftptop.o: utils.h ../config.h ../include/version.h ../include/options.h
ftptop.o: ../include/ascii.h ../include/default_paths.h
ftpwho.o: utils.h ../config.h ../include/version.h ../include/options.h
ftpwho.o: ../include/ascii.h ../include/default_paths.h
misc.o: utils.h ../config.h ../include/version.h ../include/options.h
misc.o: ../include/ascii.h ../include/default_paths.h
scoreboard.o: utils.h ../config.h ../include/version.h ../include/options.h
scoreboard.o: ../include/ascii.h ../include/default_paths.h
