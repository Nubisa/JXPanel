

TODO

- check folder permissions for server_apps subfolders, since now server_apps it has +x permission

- nginx jx package should be repacked (i added there include jxcore/*.conf;)

- for now users/plans/ domains visibility is set to database.getXXXByUserName, and this prevents seeing  e.g. users on the same level (having the same parent plan)
    since we dont have plan aliases implemented

- switching plan for the user!
    -- moving home directory
    -- suspending subplans
    -- restart of applications

- on jxPanel uninstall
    -- should we remove system users created before in panel?

- nodebb + socket.io policy issue


- when installed ghost, check app, because index.js is used !!!
- when removing a domain - remove subdomains or not?
- removing nginx for domain when domain is removed

___

- ports per domain - they are allocated, but nothing more
- users don't see users having the same hosting plan. so when superuser add a uses with unlimited plan, he cannot see it.
- ssl for JXPanel and Remote Management (bash window) - for long pwd  paths the prompt display is broken
- on azure proftpd did not work. I needed to open few other ports e.g. 20000 - 20002 and tell to proftpd:

PassivePorts 20000 20002
MasqueradeAddress corejx.cloudapp.net

later - check if ports are really needed, for active connections (are needed for passive)

see this: http://blogs.msdn.com/b/holgerkenn/archive/2014/03/19/setting-up-a-linux-ftp-server-on-windows-azure.aspx

- run panel/nginx/ftp on restart

DONE

- suspending user or plan should perform stopping an app only for this user/plan.
   for subplans it will be fired separately - DONE

- suspended user can only edit or delete. cannot add or start app - DONE
    or call remote management - NOT DONE

- update password feature - DONE

- would be nice to implement on our forms control validation similar like on login page
    (error shows under the invalid control, not as a bubble) - DONE

- installing JXcore and starting monitor on JXpanel install

- stopping monitor on JXpanel uninstall

- header - remove - DONE
- window - remove - DONE
- tabbing for log file - DONE
- dynamic control list server's side for form's instance - DONE


Tips:

- js toggle visibility of datatable column:
     $('#datatable_col_reorder').dataTable().fnSetColumnVis(1,false)  // (columnId, visible)