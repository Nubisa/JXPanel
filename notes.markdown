

TODO

- check folder permissions for server_apps subfolders, since now server_apps it has +x permission

- nginx jx package should be repacked (i added there include jxcore/*.conf;)

- for now users/plans/ domains visibility is set to database.getXXXByUserName, and this prevents seeing  e.g. users on the same level (having the same parent plan)
    since we dont have plan aliases implemented

- would be nice to implement on oor forms control validation similar like on login age
    (error shows under the invalid control, not as a bubble)




DONE

- suspending user or plan should perform stopping an app only for this user/plan.
   for subplans it will be fired separately - DONE

- suspended user can only edit or delete. cannot add or start app - DONE
    or call remote management - NOT DONE

- update password feature - DONE