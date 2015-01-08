

TODO

- check folder permissions for server_apps subfolders, since now server_apps it has +x permission

- nginx jx package should be repacked (i added there include jxcore/*.conf;)

- for now users/plans/ domains visibility is set to database.getXXXByUserName, and this prevents seeing  e.g. users on the same level (having the same parent plan)
    since we dont have plan aliases implemented

- switching plan for the user!
    -- moving home directory
    -- suspending subplans
    -- restart of applications

- SSH

- on jxPanel uninstall
    -- should we remove system users created before in panel?

- nodebb + socket.io policy issue

___

- ports per domain - they are allocated, but nothing more
- users don't see users having the same hosting plan. so when superuser add a uses with unlimited plan, he cannot see it.

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