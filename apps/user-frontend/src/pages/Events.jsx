// Events: school/campus and organizational events. Admins publish directly; students submit for admin approval.
import PostBoard from '../components/PostBoard.jsx';

export default function Events() {
  return <PostBoard kind="event" />;
}
